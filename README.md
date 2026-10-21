# Kabla

**Know what you're signing. Prove what you own.**

Artists sign music and art contracts they cannot fully read. AI-training and
voice clauses are new traps buried in ordinary-looking grants. An explanation
she can challenge — rule id, clause number, same answer tomorrow — beats a
verdict she must trust.

Kabla is a **pre-signing guard** for one artist at a time. She pastes a
contract (or opens a sample). MeTTa rules flag the traps. Two rule agents
negotiate while she approves every concession. Agreed terms become a Rights
Passport: a hash-linked certificate, badges, and a rights-health score that
explains itself. Later, the Licence Desk answers “can X use this?” with
cleared, not cleared, or needs consent from a named person.

> **Hackathon:** BASIX State of the Art Hackathon 2026
> **Official page column:** Omega AI Agents → **BASIX.MARKET — Mature Build**
> **Recorded in this repo:** Track 4 — BASIX.MARKET Builds · **Brief B:** Managing originals (Art IP and Music IP)
> **Stage built:** **License**, plus a **Protect-lite "Before" step** (self-declared onboarding with consent, MeTTa gap rules, sealed profile) that the team asked to add. Not full Protect (no identity verification, no scraping) and not Earn (no on-chain mint).
> **Team:** solo (record institution or Independent on the BASIX profile)
> **Live demo:** https://kabla-desk.fly.dev (Fly.io, Johannesburg; deterministic mode, synthetic data, no API keys on the host, **no Omega agent** so the Desk chat panel says the agent is offline). It sleeps when idle: the first visit after a quiet spell can take ~10 s. Browser check against it: [`docs/evidence/e2e-fly.md`](docs/evidence/e2e-fly.md) (13 of 13).
> **Engine:** **MeTTa on PeTTa.** The product (web + API) runs on its own and does not need Omega. Separately, **Omega's real agent loop runs natively on Windows** (PeTTa v1.0.4, Omega `main`) with Kabla's plugin: Omega's loop and memory host Kabla's four skills, which call this API, and MeTTa decides. Chat reaches it from the Desk page. Evidence: [`docs/evidence/omega-agent-excerpt.log`](docs/evidence/omega-agent-excerpt.log) and [`docs/evidence/omega-chat.md`](docs/evidence/omega-chat.md). **With a model key the chat runs live (5 of 5 test turns, 6-12 s each, NVIDIA Nemotron 3 Super through OpenRouter on 2026-10-21), but the model only phrases**: a keyword router picks the skill, the model rewrites the skill's one-line result, and any reply that drops a rule id, invents a number or leaks its own reasoning is replaced by the raw result. Without a key (or if the model is slow or down) the agent falls back to that router and labels every reply "[offline router, not an LLM]". We first let the model choose Omega's tools itself and it wandered (wrong-message answers, memory queries instead of answers); that is why. Staged-copy patches to Omega and the Windows limits (no sandbox) are in `docs/DECISIONS.md`. Do not describe this as "built on Omega".

### Why not just ask a chatbot?

An LLM may read messy wording better than Kabla. Kabla uses an LLM only for
extraction and wording (and not at all in the demo). **MeTTa decides.**

| | Asking a chatbot | Kabla |
|---|---|---|
| Same input, asked twice | Can give different answers | Same answer, every time |
| Why a clause is flagged | A convincing explanation written after the fact | The rule that actually fired (rule id + clause number) |
| Standing red lines ("never AI training") | Forgotten next chat unless she repeats them | Remembered, applied, and cited on every new contract |
| What happens after | Another chat reply | Negotiation she approves step by step |
| Proving what was agreed | Nothing | A tamper-evident, hash-linked record |
| Licence questions later | Starts from scratch | Checks stored consents and names who has not signed |

### Limits

- **Not legal advice.** Kabla is not a lawyer.
- The score is **rights-health, not credit.** It never ranks artists.
- **Synthetic data only.** Invented contracts, artists and amounts. No partner catalogues.
- **Live extraction is not deterministic.** Demo mode (`KABLA_MODE=deterministic`) uses saved extractions so the flags are repeatable. Live reading of pasted text (`KABLA_MODE=live`) is **experimental**: with Nemotron 3 Super it reproduced 24 of 30 reviewed clauses on the sample contracts, with some wrong numbers (`docs/evidence/live-extract.md`), and needs a confirm-this-clause step before real use. Sample contracts always use the saved extractions, in either mode.

---

## The story, in plain language

Zawadi is a singer. A label sends her a recording agreement. The words look
ordinary. Buried in clause 7, the label may train AI on her recordings and
voice, forever, with no extra pay. Clause 3 hands over the masters exclusively,
worldwide, with no end date. She cannot take those songs elsewhere even if the
label shelves them.

She drops the contract on Kabla's desk (or picks the Mawingu Records sample).
The desk does not write an essay. It paints a **clause map**: red and amber
flags, each with a rule id (`R-AI-01`, `R-GRANT-01`, …) and the clause number.
She opens clause 7 and sees the sentence in the contract, the English (or
Kiswahili) explanation, and — if she set a red line — the date she said
"never" to AI training.

The **simulator** shows the *shape* of the money: royalty rate, recoupment,
cross-collateralisation. The numbers are illustrative synthetic profiles, not
a forecast.

Then she sits in the **theater**. Two rule agents talk: her agent asks from
her red lines and fair defaults; the label agent walks a concession ladder from
its published policy, one step per round, never past its floor. Kabla never
agrees for her. Every concession is Approve or Reject. She can reject one and
still finish the deal.

When terms are agreed, Kabla seals a **Rights Passport**: work hash, consent
flags, collaborators, terms, Ed25519 signature, hash-linked ledger. Later
someone asks to use *Asali ya Jioni*:

- a Kenyan ad → **cleared**
- AI training → **not cleared** (her stance)
- a film that also needs Baraka's 40% → **needs the collaborator**

Change one character of the title and **Verify** turns red and names the
broken record. That is the product: a trail you can check, a deal you approve
yourself, and a certificate that notices if someone edits the past.

---

## Why the demo is deterministic

If a decision affects someone's rights, "the model felt so" is not acceptable.
A fixed rule can be inspected, challenged and fixed. The trail is the cause,
not a story written after. We can assert "c001 must produce these 4 red flags".
Rule ids live in [`docs/RULES.md`](docs/RULES.md).

A live extraction error would still flow into the rules. Next: a "please
confirm this clause" check when confidence is low.

---

## What the desk does (UI → API → engine)

The web app is seven screens. It does not compute flags itself. Every click
that matters is a `fetch` to the FastAPI backend; the backend writes
`facts.metta`, runs PeTTa, and returns structured results the UI paints.

```
Desk → Clause map → Simulator → Theater → Licence desk → Passport → Verify
```

| Screen | What the artist does | What the backend does |
|---|---|---|
| **Desk** | Pick a sample contract or paste text. Set language EN/SW. | Load contract + artist/work. Extraction is a fixture (deterministic) or a validated LLM parse (live). |
| **Clause map** | Open a flag. Read fairness (flag count, clause trail) and tap as-written vs after-negotiation scores. | `POST /analyze` + `GET /readiness` → MeTTa `flags-of` and `score.metta` on hypothetical events. Fairness is a summary of flags, not a new model. |
| **Simulator** | Try stream counts. Compare as-written vs after. | `POST /simulate` → MeTTa recoupment + cross-collateral. Illustrative only. |
| **Theater** | Approve or reject each concession. See the checklist (warnings only). | `POST /negotiate` → MeTTa artist/label moves. Artist is the only one who applies a concession. Max 4 rounds. |
| **Licence desk** | Ask "can they use this work for X?" | `POST /licence` → MeTTa verdicts (`R-LIC-AI`, `R-LIC-TERM`, `R-LIC-CONSENT`, `R-LIC-OK`, …). |
| **Passport** | Review the pre-sign checklist, then issue the certificate after agreed terms. | Hash work, sign with Ed25519, append hash-linked ledger, emit Open Badges v2-shaped badges + ERC-721-shaped metadata. **Nothing is minted.** Checklist never blocks. |
| **Financier view** | Read a backer sheet: owners, open flags, AI stance, consent gaps, the same score. | `GET /passport/{artist}/financier` rearranges existing facts. No new score. Banner: not credit, not lending advice, SYNTHETIC. |
| **Verify** | Run the tamper test (or check a certificate). | `POST /verify` → `intact` or `tampered: record N …`. |

State is held in the API (SQLite) and in the browser session (`web/src/state.tsx`).
The UI talks to `VITE_API_URL` or `/api`. CORS is open for the demo.

---

## How a decision is made

```
contract text
    → clause facts (fixture or LLM, validated vocabulary)
        → MeTTa on PeTTa  (flags, red lines, licence, simulate, negotiate)
            → EN/SW templates
                → UI (trail always visible)
                    → passport / ledger / verify
```

Per request the bridge writes a temp `facts.metta` and runs:

```text
swipl -q -s PeTTa/src/main.pl -- engine/main.metta [policy] facts.metta query.metta --silent
```

It parses lines that start with `(result `. Boring on purpose. Rule functions
are not result constructors (`flags-of` vs `flag`) so PeTTa arity stays honest.

### Flags the engine knows

| Rule | Severity | What it matches |
|---|---|---|
| `R-GRANT-01` | red | Perpetual + worldwide + exclusive grant |
| `R-GRANT-02` | amber | Perpetual but non-exclusive |
| `R-TERM-01` | red | Term beyond the artist's red line |
| `R-AI-01` | red | AI training granted without opt-in |
| `R-AI-02` | amber | Vague AI / "new technology" wording |
| `R-VOICE-01` | red | Synthetic voice / likeness rights |
| `R-REVERT-01` | amber | Rights never revert |
| `R-XCOLL-01` | amber | Cross-collateralisation across agreements |
| `R-OPT-01` | amber | Option periods only the label can exercise |
| `R-ROY-01` | amber | Royalty below the (illustrative) benchmark |
| `R-AUDIT-01` | amber | No audit right |
| `R-SYNC-01` | amber | Sync without the artist's approval |
| `R-SPLIT-01` | amber | Co-writer splits missing or not 100% |

A clause that breaks a standing red line is **raised to red** and the trail
cites the date the line was set. Full English and Kiswahili copy:
[`docs/RULES.md`](docs/RULES.md).

### Negotiation (artist always last)

Two MeTTa agents; the artist is not one of them and is the only closer.

- Artist agent opens red/amber flags in a fixed order and asks from red lines
  (`never` AI, max 7 years) or a fair default on the label's ladder.
- Label agent reads a **synthetic policy** (`data/policies/`). It concedes at
  most one step per round and never past the floor.
- Moves: `accept` / `counter` / `reject`, each with the policy line and advice
  (`concede`, `hold-redline`, `hold-flagged`, `standoff`, `walk-away`). Advice
  is never auto-applied.
- End: **agreed**, **standoff** ("a lawyer should look at this"), or
  **walk-away** (artist rejected a `reject` on a red line).

See [`docs/NEGOTIATION.md`](docs/NEGOTIATION.md).

### Passport

Work SHA-256 → `certificate.json` (consent flags, collaborators, AI tools,
terms, `prev_hash`) → Ed25519 sign → hash-linked ledger
`record_hash = SHA-256(seq : payload_hash : prev_hash)`. Demo keys live in
`var/keys/` (git-ignored). Issuer on badges is **"Kabla (demo issuer, not
BASIX)"**. Score points only come from verified events in *this* artist's log;
everyone starts at 0. Details: [`docs/PASSPORT.md`](docs/PASSPORT.md).

---

## Synthetic demo data

Three contracts, two artists, one work. All labelled SYNTHETIC.

| Id | Label | Character |
|---|---|---|
| `c001` | Mawingu Records | Trap-heavy (the main demo) |
| `c002` | Pwani Publishing | Mixed |
| `c003` | Kilele Collective | Fair |

Artists: **Zawadi** (red line: never AI training; term cap 7 years) and
**Baraka** (40% collaborator on *Asali ya Jioni* / `w-asali`). Fixtures:
`data/extractions/c001–c003.json`. Policies: `data/policies/*.metta`.

---

## Technology

- **MeTTa rules** on [PeTTa](https://github.com/trueagi-io/PeTTa) (`fea83178`, MIT) via SWI-Prolog ≥ 9.3
- **FastAPI** + SQLite (`api/kabla/`)
- **React + Vite + Tailwind** (`web/`) — Landing, demo sign-in and set-up wizard (front door), Onboard (Before), Desk, ClauseMap, Simulator, Theater (During), LicenceDesk, Passport, Financier, Verify (After)
- **Ed25519** (PyNaCl) hash-linked ledger; Open Badges v2-shaped badges
- **EN/SW** deterministic templates (`api/kabla/i18n/`) — Swahili is AI-drafted and must be checked by a fluent speaker
- **Omega plugin** (`omega-plugin/`) — Kabla skills, an LLM provider (router picks the skill, a live model only phrases the result, offline router if no key or on failure; timeout, retry, circuit breaker, output vetting) and a file chat channel. `python scripts/omega_run.py` runs the real Omega agent loop under a watchdog; `python scripts/omega_smoke.py` talks to it through the API. Earlier skill-registry-only harness: `scripts/omega_native.py`.

Architecture sketch: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## One-command run

```bash
python scripts/tasks.py setup   # PeTTa, Python venv, npm, demo keys
python scripts/tasks.py run     # API :8000  +  web :5173
```

Linux/macOS: `make setup && make run`. Requires **SWI-Prolog ≥ 9.3** and **Node 22**.
Windows: add `C:\Program Files\swipl\bin` to `PATH` if `swipl` is not found.

Omega agent (optional, Windows-native; needs the Omega Python deps installed, see `docs/DECISIONS.md`):
`python scripts/omega_run.py` with the API on :8000. Add `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` to `.env` for a live model.

Docker (API + web; no Omega): `docker compose up --build`. Web is on
http://localhost:5173 and proxies `/api` to the API.

- API health: http://localhost:8000/health
- Landing page (demo sign-in, no real accounts): http://localhost:5173
- Desk: http://localhost:5173/desk
- Demo jump (Mawingu): http://localhost:5173/desk?sample=c001

`KABLA_MODE=deterministic` (default) uses fixtures and templates — no LLM, no
network. Copy `.env.example` to `.env` for live mode; never commit secrets.

---

## How to test

```bash
python scripts/tasks.py test          # MeTTa + pytest + web build
python scripts/e2e_demo.py            # three demo scenes → docs/transcripts/
node scripts/e2e_browser.mjs          # real-browser click-through of every room → docs/E2E.md (needs API, `npx vite`, playwright-core in .vendor/e2e)
```

CI: `.github/workflows/ci.yml`. Clean-clone gate: `scripts/verify_clean_clone`
(recorded passed). Target is a green suite before each commit.

---

## Demo video

≤ 3:00, captioned. No real faces without written consent. No real data.
Script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). Link goes here when recorded.

The human submits on [BASIX.MARKET](https://basix.market). Agents do not submit
and do not claim a prize, a placement, or co-ownership.

---

## Honest status

| Claim | Truth |
|---|---|
| "Built on Omega" | **No.** The product runs on MeTTa on PeTTa. What is true: the real Omega agent loop runs with Kabla's plugin and answers chat through Kabla's MeTTa-backed skills (log and chat transcript in `docs/evidence/`), but Omega's own tool-choosing by an LLM is **not** what answers (a keyword router picks the skill; the model only phrases, or an offline router answers when there is no key), and there is no Omega Linux sandbox. |
| "The Before step verifies who you are" | **No.** It is self-declared and consent-recorded; the seal proves the text did not change after sealing. Nothing is read from any social platform. |
| "AI reads the contract and decides" | **No.** MeTTa decides. LLM is extract/phrase only, and off in the demo. |
| "This is legal advice" | **No.** See [LIMITATIONS.md](LIMITATIONS.md). |
| "The score is a credit / ranking" | **No.** It never compares artists. |
| "We minted an NFT" | **No.** Metadata is ERC-721-shaped so a listing *could* exist. |
| "Always-on production host" | Local + optional container. Ephemeral tunnels are not a durable host. |

What is in scope next (Protect, Earn, live Omega, feature-phone chat) lives in
[`docs/NEXT.md`](docs/NEXT.md) and is **out of this License-stage build**.

---

## Team

Record names on BASIX.MARKET. Do not claim a prize or co-ownership for the team.

## Docs

[Limitations](LIMITATIONS.md) · [AI disclosure](AI_DISCLOSURE.md) · [Rules](docs/RULES.md) · [Negotiation](docs/NEGOTIATION.md) · [Passport](docs/PASSPORT.md) · [Architecture](docs/ARCHITECTURE.md) · [What's next](docs/NEXT.md) · [Build spec](docs/BUILD_SPEC.md)

## Credits

PeTTa (MIT), Omega (Apache-2.0), BASIX starter. See [NOTICE](NOTICE).
License of this repo: [Apache-2.0](LICENSE).
