# Kabla

**Know what you're signing. Prove what you own.**

Kabla ("before") is a desk for one job: read a music or art contract *before*
the artist signs it, flag every trap with the clause behind it, negotiate a
fairer version with the label's agent in the open, and, once terms are agreed,
issue a tamper-evident Rights Passport.

It is not a chatbot that "looks over" a deal. An explanation the artist can
challenge — rule id, clause number, same answer tomorrow — is the product. A
confident paragraph with no trail is the thing it was built against.

> **Hackathon:** BASIX State of the Art Hackathon 2026
> **Official page column:** Omega AI Agents → **BASIX.MARKET — Mature Build**
> **Recorded in this repo:** Track 4 — BASIX.MARKET Builds · **Brief B:** Managing originals (Art IP and Music IP)
> **Stage built:** **License** (not Protect, not Earn)
> **Team:** solo (record institution or Independent on the BASIX profile)
> **Engine:** **MeTTa on PeTTa.** Omega plugin files exist; they have **not** been loaded in a live Omega agent. Do not describe this as "built on Omega".

All contracts, artists, labels, works and amounts are **SYNTHETIC**. No partner
catalogues (Incantio, HFAS, Harlem CLxR, AI for Peace) and no real music or art
files are used.

Kabla is **not a lawyer** and does not give legal advice. The Rights Passport
is evidence of agreed terms, not a court instrument or a collecting-society
registration. The rights-health score is **not a credit score**.

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

## How this is different from Claude (or any LLM chatbot)

Claude is a language model. You paste a contract; it predicts a helpful
reply. It can be careful. It can also skip a clause, invent a confident
summary, or change its mind if you ask again. There is no stable rule id, no
forced pointer to "clause 7", and nothing that stops it from agreeing on your
behalf. If you ask "does this look fine?", a black box that says yes is worse
than no tool at all.

Kabla is a **product**. The UI only renders what the API and the MeTTa engine
already decided. In demo mode (`KABLA_MODE=deterministic`, the default) there
is **no LLM and no network**. Clause facts come from hand-checked fixtures.
Explanations come from fixed EN/SW templates. The same contract and the same
facts produce the same flags tomorrow.

| | Claude / an LLM chat | Kabla |
|---|---|---|
| What it is | A language model | A desk: UI + API + MeTTa rules + ledger |
| What it does with a contract | Explains in paragraphs | Extracts facts, then fires **named rules** |
| Who decides flags, verdicts, score, moves | The model, in prose | **MeTTa.** The LLM never decides. |
| Can it change its mind? | Yes | Not if the facts and rules are the same |
| Trail | "Because I think…" | `R-AI-01`, clause 7, EN/SW template |
| Negotiation | It might role-play both sides | Two rule agents; **you** Approve or Reject |
| Proof of ownership | None | Hash-sealed certificate + tamper check |
| Demo mode | Always a model | **No model at all** |
| Legal advice | Still not a lawyer | Still not a lawyer — and it says so |

The LLM is optional and narrow. In `KABLA_MODE=live` it may (a) turn contract
text into structured clause facts and (b) polish wording. It does **not**
choose severity, raise a red line, accept a concession, clear a licence, or
award a score point. Those come from `engine/*.metta`, each with a rule id
documented in [`docs/RULES.md`](docs/RULES.md).

Claude is the voice. Kabla is the ledger. In this project the voice is
optional; the ledger is the product.

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
- **React + Vite + Tailwind** (`web/`) — Desk, ClauseMap, Simulator, Theater, LicenceDesk, Passport, Verify
- **Ed25519** (PyNaCl) hash-linked ledger; Open Badges v2-shaped badges
- **EN/SW** deterministic templates (`api/kabla/i18n/`) — Swahili is AI-drafted and must be checked by a fluent speaker
- **Omega plugin** (`omega-plugin/`) — files only; **not loaded**. Same HTTP API if it ever is.

Architecture sketch: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## One-command run

```bash
python scripts/tasks.py setup   # PeTTa, Python venv, npm, demo keys
python scripts/tasks.py run     # API :8000  +  web :5173
```

Linux/macOS: `make setup && make run`. Requires **SWI-Prolog ≥ 9.3** and **Node 22**.
Windows: add `C:\Program Files\swipl\bin` to `PATH` if `swipl` is not found.

Docker (API + web; no Omega): `docker compose up --build`. Web is on
http://localhost:5173 and proxies `/api` to the API.

- API health: http://localhost:8000/health
- Desk: http://localhost:5173
- Demo jump (Mawingu): http://localhost:5173/?sample=c001

`KABLA_MODE=deterministic` (default) uses fixtures and templates — no LLM, no
network. Copy `.env.example` to `.env` for live mode; never commit secrets.

---

## How to test

```bash
python scripts/tasks.py test          # MeTTa + pytest + web build
python scripts/e2e_demo.py            # three demo scenes → docs/transcripts/
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
| "Built on Omega" | **No.** Plugin stubs exist. Default run is MeTTa on PeTTa (L0). |
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
