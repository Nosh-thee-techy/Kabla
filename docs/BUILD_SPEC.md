# KABLA — Build Spec

> Hand this whole file to your coding agent (Cursor / Claude Code) as the first message, and also commit it to the repo as `docs/BUILD_SPEC.md`.
> Hackathon: BASIX State of the Art Hackathon 2026 · Track 4 (BASIX.MARKET Builds), Brief B (Managing originals: Art IP and Music IP) · Stage built: **License** · Stack: MeTTa + PeTTa (+ Omega)

---

## 0. Instructions to the coding agent (read first, obey throughout)

1. **Commit early and often.** Small commits, one logical step each, conventional-commit messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Target **50+ commits** following Section 14. Never batch a day of work into one commit. The commit history is evidence of real work for the reviewers (the judging includes collaboration and documentation).
2. **Run the tests before every commit.** Never commit a red build to `main`. If something is half done, put it on a branch or behind a feature flag.
3. **Do not invent APIs.** Before using PeTTa or Omega, read their docs and examples in the cloned repos (`PeTTa/examples/`, `Omega/docs/reference-plugin-api.md`, `Omega/lib_nal.metta`). The MeTTa snippets in this spec are **sketches of intent**. Verify the syntax by running them. If a snippet fails, fix it from the real examples and note it in `docs/DECISIONS.md`.
4. **Never claim what is not running.** The README may say "built on Omega" only if the Omega plugin actually loads and a demo path uses it. Otherwise it must say "MeTTa on PeTTa" and list Omega as next step. Honesty is a scoring feature and a disqualification guard.
5. **MeTTa decides; the LLM only reads and phrases.** The LLM may (a) extract clauses from contract text into structured JSON and (b) polish wording. Every verdict, flag, score, and negotiation move must come from MeTTa rules, with a trail. The demo must also run in **deterministic mode with no LLM and no network** (pre-extracted fixtures).
6. **Synthetic data only.** All contracts, artists, labels, works and amounts are invented and labeled `SYNTHETIC` in the UI and files. No real partner data (Incantio, HFAS, Harlem CLxR, AI for Peace) without documented permission. No real people's names, no real music or art files.
7. **No secrets in git.** `.env` is git-ignored, `.env.example` is committed.
8. **Keep an AI log.** Append to `AI_DISCLOSURE.md` every time AI generates code or text (tool, purpose). Never remove entries.
9. **Stay in scope.** We build the **License stage**. The Passport (certificate, badge, score) is the *output of licensing*, not a separate product. If an idea falls outside scope, add it to `docs/NEXT.md`, don't build it.
10. **Do not submit on the user's behalf.** The human submits on BASIX.MARKET.

---

## 1. One-line pitch

**Kabla ("before") reads a music or art contract before the artist signs it, shows every trap with the clause behind it, negotiates a fairer version with the label's agent in front of the artist, and, once terms are agreed, issues a tamper-evident Rights Passport: a hash-sealed certificate, verified badges and a rights-health score that explains itself.**

Tagline: *Know what you're signing. Prove what you own.*

## 2. The problem (say it plainly in README and video)

Young artists often sign deals they cannot fully read: masters owned forever, every territory, exclusivity, and now clauses allowing AI training on their voice. Lawyers are expensive and the people who need help most can't afford one. Existing "AI contract tools" are black boxes, and a black box that tells an artist "this looks fine" is worse than useless.

**Do not state statistics about how common predatory deals are in Kenya unless you have a credible, cited source.** Say what is demonstrably true: contracts are hard to read, rights terms matter, and an explanation the artist can challenge is better than a verdict she must trust.

## 3. Product concept (the whole loop)

```
Contract text ──► Clause extraction (LLM or fixture) ──► Structured clause facts
       │                                                       │
       │                                                       ▼
       │                                          MeTTa rule engine (PeTTa)
       │                                   flags • licence verdicts • simulations
       │                                                       │
       ▼                                                       ▼
 Clause Map UI ◄──── reasoning trail (rule id + clause no.) ◄───┘
       │
       ▼
 Negotiation Theater: Artist agent ⇄ Label agent (rules-based, ≤4 rounds,
 artist approves every concession)
       │
       ▼
 Agreed terms ──► Rights Passport:
        • work hash + signed certificate (NFT-style metadata, hash-linked ledger)
        • badges (Open Badges v2-style assertions)
        • rights-health score (every point traced to a verified event)
       │
       ▼
 Licence Desk: "Can brand X use this track in Kenya for 6 months?"
 → cleared / not cleared / needs consent from [named person], with clause trail
```

### 3.1 Features, in priority order

**P0 (must ship, this is the product):**
1. Contract Desk: paste or pick a synthetic contract, run analysis.
2. Clause Map: colored highlights (green/amber/red), click a clause to see the trail.
3. Rule engine in MeTTa: red-flag rules, licence verdict rules, score rules.
4. Earnings Simulator: "on N streams you keep X under this deal vs Y under counter" (illustrative rates, labeled).
5. Negotiation Theater: two rule-based agents, rounds, artist approve/reject.
6. Licence Desk with three preset requests (Section 11).
7. Rights Passport: hash, signed certificate, verify page with a **tamper test**.
8. English and Swahili explanations from deterministic templates.
9. Tests, README, `AI_DISCLOSURE.md`, `LIMITATIONS.md`, 3-minute video script.

**P1 (the "Omega" layer):**
10. Omega plugin exposing Kabla skills; **Red Lines memory**: the artist's standing rules ("never my voice for AI") remembered across contracts and applied automatically, citing when they were set.
11. Chat access through an Omega channel (WebSocket `wschat` or Telegram) so the artist can ask "why?" in plain language.

**P2 (stretch, only if P0 and P1 are solid):**
12. NAL truth values `(stv f c)` for clause-extraction confidence, merged by Omega's own revision, low confidence triggers "please confirm this clause".
13. Testnet mint of the certificate metadata (never mainnet, never real money).
14. Badges exportable as JSON files matching Open Badges v2 shape.

### 3.2 What Kabla is NOT (state this in LIMITATIONS.md and the video)

- Not a lawyer and not legal advice. The certificate is evidence of agreed terms, not a court-enforceable instrument.
- The rights-health score is **not a credit or lending score** and never ranks artists against each other or penalizes newness.
- Benchmarks used in the earnings simulator are illustrative synthetic profiles, not market facts.
- Swahili text is generated from reviewed templates and should be checked by a fluent speaker before real use.

---

## 4. Architecture

```
┌──────────────────────────── web (Vite + React + TS + Tailwind) ───────────────────────────┐
│ Desk │ Clause Map │ Simulator │ Negotiation Theater │ Licence Desk │ Passport │ Verify    │
└───────────────┬───────────────────────────────────────────────────────────────────────────┘
                │ REST (JSON)
┌───────────────▼──────────────────── api (FastAPI, Python 3.11+) ──────────────────────────┐
│ routers: contracts, analyze, simulate, negotiate, licence, passport, verify, chat          │
│ services: extractor (LLM|fixture) · metta_bridge · negotiator · passport · scoring · i18n  │
│ store: SQLite (artists, works, contracts, events, ledger)                                  │
└───────────────┬───────────────────────────────────────────────────────────────────────────┘
                │ subprocess / janus
┌───────────────▼────────────────── engine (MeTTa on PeTTa / SWI-Prolog) ───────────────────┐
│ schema.metta · clauses.metta · flags.metta · licence.metta · negotiate.metta · score.metta │
│ i18n_keys.metta · policies/*.metta (label policies, artist red lines)                      │
└───────────────▲───────────────────────────────────────────────────────────────────────────┘
                │ loadOmegaPlugin (P1)
┌───────────────┴──────────────── omega-plugin (Omega skills + memory) ─────────────────────┐
│ skills: kabla-analyze, kabla-licence, kabla-redline-set, kabla-explain                     │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**The bridge design (important for reliability):** the API writes the facts for one request into a temporary `.metta` file (`facts.metta`), runs PeTTa on `engine/main.metta` that imports the rule files and the facts, and parses printed results. This is boring on purpose. It is easy to debug, test and show. A persistent process is an optimization we do not need.

**Determinism mode:** env `KABLA_MODE=deterministic` uses fixture extractions and template language. `KABLA_MODE=live` uses an LLM for extraction and optional phrasing. Both modes must pass the same rule tests.

**Providers (P1):** Omega supports several LLM providers through environment variables (Anthropic default, OpenAI, ASI:One, OpenRouter). Keys live in the environment only.

---

## 5. Repo structure

Start by forking/using the template `BASIXmarket-io/hackathon-starter` (it includes `BRIEF.md`, `SUBMISSION.md`, `AGENTS.md`). **Note:** the starter's `BRIEF.md` is stale vs. the official Hacker Pack (it lists 3 tracks and a different deadline and judging weights). Follow the Hacker Pack and announcements on BASIX.MARKET.

```
kabla/
├── README.md                     # first screen: what, track/stage, one-command run, video link
├── AI_DISCLOSURE.md              # every AI tool used + what for (keep updated)
├── LIMITATIONS.md                # honest scope, legal/score/benchmark caveats
├── LICENSE                       # Apache-2.0 (credit PeTTa/Omega in NOTICE)
├── NOTICE                        # third-party credits and licences
├── SUBMISSION.md                 # starter checklist, ticked as we go
├── Makefile                      # make setup | run | test | demo | verify
├── docker-compose.yml            # api + web (+ omega profile)
├── .env.example
├── .gitignore
├── .github/workflows/ci.yml      # lint + pytest + metta tests
├── docs/
│   ├── BUILD_SPEC.md             # this file
│   ├── DECISIONS.md              # dated decisions + fixes to sketches
│   ├── ARCHITECTURE.md           # diagram + data flow
│   ├── RULES.md                  # every rule id, plain-English meaning, EN + SW text
│   ├── NEGOTIATION.md            # protocol, policies, worked example
│   ├── PASSPORT.md               # certificate, ledger, badges, score formula
│   ├── NEXT.md                   # what we'd build next (incl. Protect/Earn stages)
│   ├── DEMO_SCRIPT.md            # 3-minute storyboard with exact beats
│   ├── BUILD_LOG.md              # short dated log (helps the documentation score)
│   └── transcripts/
│       ├── 01-contract-analysis.md
│       ├── 02-negotiation.md
│       ├── 03-licence-verdicts.md
│       └── 04-tamper-test.md
├── data/                         # ALL SYNTHETIC, each file starts with SYNTHETIC banner
│   ├── contracts/
│   │   ├── c001_mawingu_records.txt        # predatory: perpetual, worldwide, exclusive, AI-training
│   │   ├── c002_pwani_publishing.txt       # mixed: fair term, vague AI clause, cross-collateralization
│   │   └── c003_kilele_collective.txt      # mostly fair: used for contrast
│   ├── extractions/                        # fixture clause JSON per contract (deterministic mode)
│   ├── artists/                            # synthetic artist profiles + red lines
│   ├── works/                              # synthetic work metadata (no real audio/art)
│   └── policies/                           # label negotiation policies (synthetic)
├── engine/                       # MeTTa
│   ├── main.metta                # entrypoint: imports modules + facts, prints JSON-ish results
│   ├── schema.metta              # atom shapes + documentation comments
│   ├── clauses.metta             # clause vocabulary (types, severities)
│   ├── flags.metta               # red-flag rules → (flag clause rule-id severity)
│   ├── licence.metta             # can-use? rules with clause trail
│   ├── simulate.metta            # earnings maths for the simulator
│   ├── negotiate.metta           # concession ladders, accept/counter/reject
│   ├── score.metta               # rights-health score from verified events
│   ├── redlines.metta            # artist standing rules and how they fire
│   ├── i18n_keys.metta           # rule-id → message-key map
│   └── tests/
│       ├── test_flags.metta
│       ├── test_licence.metta
│       ├── test_negotiate.metta
│       └── test_score.metta
├── api/
│   ├── pyproject.toml
│   ├── kabla/
│   │   ├── main.py               # FastAPI app, CORS, router mount
│   │   ├── config.py             # env, mode flags
│   │   ├── models.py             # pydantic: Clause, Contract, Flag, Verdict, Passport...
│   │   ├── routers/              # contracts.py analyze.py simulate.py negotiate.py licence.py passport.py verify.py chat.py
│   │   ├── services/
│   │   │   ├── extractor.py      # LLM extraction (live) or fixture loader (deterministic)
│   │   │   ├── metta_bridge.py   # writes facts.metta, runs PeTTa, parses output
│   │   │   ├── negotiator.py     # round loop, ledger of moves
│   │   │   ├── passport.py       # hash, sign, ledger append, badges
│   │   │   ├── scoring.py        # calls score.metta, attaches event links
│   │   │   └── i18n.py           # EN/SW template renderer + glossary
│   │   ├── i18n/{en.json,sw.json}
│   │   └── store.py              # SQLite
│   └── tests/                    # pytest: bridge, extractor fixtures, passport, e2e
├── omega-plugin/                 # P1
│   ├── README.md
│   ├── kabla_plugin.metta        # skills registered through the plugin API
│   ├── kabla_skills.py           # Python helpers for the skills
│   └── tests/
├── web/
│   ├── package.json  vite.config.ts  tailwind.config.ts
│   └── src/
│       ├── main.tsx  App.tsx  api.ts  i18n.ts  theme.css
│       ├── pages/ Desk.tsx ClauseMap.tsx Simulator.tsx Theater.tsx LicenceDesk.tsx Passport.tsx Verify.tsx
│       ├── components/ ClauseHighlight.tsx TrailDrawer.tsx ScoreRing.tsx BadgeShelf.tsx RoundCard.tsx LangToggle.tsx SyntheticBanner.tsx
│       └── lib/ format.ts hash.ts
└── scripts/
    ├── setup_petta.sh            # clone + pin PeTTa, install SWI-Prolog deps
    ├── run_demo.sh               # seeds data, launches api+web, prints demo URLs
    ├── record_checklist.md       # pre-recording checklist (consent, captions, <3:00)
    └── verify_clean_clone.sh     # clone to temp dir, setup, run tests (submission gate)
```

---

## 6. MeTTa design

> Everything below is a **sketch of intent**. Verify syntax by running it in PeTTa. Keep each rule small, give each a stable **rule id**, and give each an EN and SW message key.

### 6.1 Atom schema (facts the API asserts per request)

```metta
; ── contract and parties ──
(contract c001)
(party c001 label "Mawingu Records")        ; SYNTHETIC
(party c001 artist "Zawadi")                ; SYNTHETIC

; ── clause facts (from extraction) ──
; (clause <contract> <number> <type> <attr> ...)
(clause c001 4 grant master perpetual worldwide exclusive)
(clause c001 7 ai-training granted no-opt-in)
(clause c001 9 voice-likeness granted synthetic-voice)
(clause c001 11 royalty 12-percent recoupable)
(clause c001 13 reversion none)
(clause c001 15 cross-collateral yes)
(clause c001 18 option-periods 3 label-only)

; ── work and consent facts (for licensing) ──
(work w-asali "Asali ya Jioni")             ; SYNTHETIC
(owner w-asali master zawadi 100)
(owner w-asali composition zawadi 60)
(owner w-asali composition baraka 40)
(consent w-asali baraka sync kenya 2026-10-01)   ; a verified consent event

; ── artist standing rules (Red Lines memory, P1 makes these persistent) ──
(redline zawadi ai-training never set-on 2026-10-19)
(redline zawadi term-max-years 7 set-on 2026-10-19)
```

### 6.2 Red-flag rules (clause → flag with rule id and severity)

```metta
; R-GRANT-01: perpetual + worldwide + exclusive grant of the master
(= (flag $c $n R-GRANT-01 red)
   (match &self (clause $c $n grant master perpetual worldwide exclusive) True))

; R-AI-01: AI training granted without opt-in
(= (flag $c $n R-AI-01 red)
   (match &self (clause $c $n ai-training granted no-opt-in) True))

; R-VOICE-01: synthetic voice / likeness rights granted
(= (flag $c $n R-VOICE-01 red)
   (match &self (clause $c $n voice-likeness granted $x) True))

; R-REVERT-01: no reversion of rights
(= (flag $c $n R-REVERT-01 amber)
   (match &self (clause $c $n reversion none) True))

; R-XCOLL-01: cross-collateralization across works
(= (flag $c $n R-XCOLL-01 amber)
   (match &self (clause $c $n cross-collateral yes) True))
```

Full rule list to implement (each with EN + SW message and a "what it costs you" sentence): `R-GRANT-01` perpetual worldwide exclusive; `R-GRANT-02` perpetual non-exclusive (amber); `R-TERM-01` term beyond redline; `R-AI-01` AI training without opt-in; `R-AI-02` AI training vague wording (amber); `R-VOICE-01` voice/likeness; `R-REVERT-01` no reversion; `R-XCOLL-01` cross-collateralization; `R-OPT-01` label-only option periods; `R-ROY-01` royalty below the selected benchmark profile (labeled illustrative); `R-AUDIT-01` no audit right; `R-SYNC-01` label may license sync without artist approval; `R-SPLIT-01` splits not stated or not summing to 100.

**Redline interaction:** a standing red line that a clause violates raises a second trail line: "You told Kabla on 2026-10-19: never AI training. Clause 7 violates this." Severity is raised to red.

### 6.3 Licence verdict rules (with clause trail)

A licence request is a set of atoms; the verdict is `cleared`, `not-cleared`, or `needs-consent`, plus the trail.

```metta
; request: (request r1 w-asali ad kenya 6-months brand "Nuru Soaps")   ; SYNTHETIC
; use types: ad, sync-film, sync-ad, live, ai-training, sample

; AI training is denied unless an explicit opt-in grant exists
(= (verdict $r not-cleared R-LIC-AI)
   (match &self (request $r $w ai-training $t $d $p)
          (unless-optin $w)))

; sync needs consent from every composition owner
(= (missing-consent $r $who)
   (match &self (request $r $w $use $terr $d $p)
     (match &self (owner $w composition $who $pct)
        (no-consent-for $w $who $use $terr))))

(= (verdict $r needs-consent R-LIC-CONSENT) ...)   ; list each $who with their share
(= (verdict $r cleared R-LIC-OK) ...)              ; all owners consented, territory/term ok
```

Every verdict returns `(trail (rule-id) (clause-numbers) (facts-used))`. The UI must be able to render: "Not cleared: Baraka (40% of the composition) has not given sync consent for Kenya."

### 6.4 Negotiation (rules-based, human-in-the-loop)

- **Artist agent** proposes counters on each red/amber flag in a fixed priority order (AI/voice, grant scope, term, reversion, royalty).
- **Label agent** holds a **policy** (synthetic file in `data/policies/`): a concession ladder per clause type. Example for term: `ask: perpetual → floor: 10 years`, for AI training: `ask: granted → floor: opt-in per use, paid`, for reversion: `ask: none → floor: after 7 years if unrecouped`.
- Each round: the label agent returns `accept | counter(new terms) | reject(reason)`. Every move carries rule id + policy line.
- **The artist approves or rejects each concession** in the UI before it is applied. Kabla never agrees on her behalf.
- Max **4 rounds**. End states: `agreed`, `standoff` (lists unresolved clauses and "what a lawyer should look at"), or `walk-away` (if a redline is a hard stop).
- Output is a **negotiation ledger** (ordered moves) saved as a transcript in `docs/transcripts/02-negotiation.md`.

### 6.5 Rights-health score (transparent, safe)

A score from 0–100 built only from **verified events** in the artist's event log. Every point links to an event id. The UI can show "why 72".

| Event (verified) | Points |
|---|---|
| Work registered with hash and artist consent | +15 |
| All contributors listed | +10 |
| AI tools used are disclosed on the work | +10 |
| AI-training stance explicitly set (never / opt-in / granted) | +10 |
| Splits agreed by every co-writer and total = 100% | +20 |
| Contract analysed and no unresolved red flags | +15 |
| Every licence granted has all required consents | +15 |
| Unresolved red flag in a signed contract | −5 each (floor 0) |
| Licence granted without a required consent | −10 each |

Rules for the score: **never compare artists, never penalize a new artist (score starts at 0 with "next best steps"), always show reasons, always label it "rights-health, not credit".** Weights are configurable constants documented in `docs/PASSPORT.md`.

### 6.6 Earnings simulator (illustrative)

`simulate.metta` computes, for N streams, what the artist keeps under (a) the contract as written and (b) the agreed counter, using a **synthetic benchmark profile** (e.g. `profile-illustrative-A`). Include recoupment of an advance. The UI always shows the label "illustrative, synthetic rates".

---

## 7. Rights Passport

### 7.1 Certificate (NFT-style, but honest)

1. Take the work file (synthetic placeholder bytes in the demo) → **SHA-256** hash.
2. Build `certificate.json`:

```json
{
  "kabla_version": "1.0",
  "label": "SYNTHETIC DEMO — not a legal instrument",
  "work": {"title": "Asali ya Jioni", "sha256": "…", "registered_at": "…"},
  "artist": {"name": "Zawadi", "consent_to_register": true, "consent_to_sell": false},
  "creation": {"collaborators": ["Baraka"], "ai_tools": ["none"], "original_location": "held by artist"},
  "terms": {
    "ai_training": "never",
    "territories": ["KE"],
    "term_years": 5,
    "splits": {"master": {"zawadi": 100}, "composition": {"zawadi": 60, "baraka": 40}},
    "clause_refs": ["c003-§4", "c003-§7"]
  },
  "prev_hash": "…",
  "signature": {"alg": "Ed25519", "pubkey": "…", "sig": "…"}
}
```

3. Append to a **hash-linked ledger** (each record includes `prev_hash`, so editing any past record breaks every later link).
4. Also emit **ERC-721-style metadata JSON** (`name`, `description`, `image`, `attributes`, `properties.rights`) so it is ready for a marketplace listing. A phigital twin is recorded as a *reference* to the physical original, which never moves.
5. **Verify page:** paste or upload a certificate (and optionally the work file) → green "intact" or red "tampered: record 3 hash mismatch". The video includes a **tamper test**: change one character, verification fails.
6. Use PyNaCl or `cryptography` for Ed25519. Keys for the demo are generated at setup and git-ignored.
7. **Registration needs permission.** The register step shows an explicit opt-in, with a separate "register but don't sell" choice.
8. P2 only: testnet mint. Never claim a mainnet deployment.

### 7.2 Badges

Issued automatically when verified events occur. Each badge is a JSON assertion in the shape of **Open Badges v2** (BASIX uses Open Badges v2 for its own credentials), with the issuer clearly **"Kabla (demo issuer, not BASIX)"**.

Badge set: **Read Before Signing** (contract analysed), **AI-Training Locked** (stance set to never/opt-in), **Splits Agreed** (all co-writers confirmed, total 100%), **Clean Deal** (no unresolved red flags), **Fully Cleared** (a licence granted with all consents). Each badge links to the event ids that earned it.

### 7.3 Score

Computed per Section 6.5, shown as a ring with a **"Why this number"** drawer listing event → points → clause or consent link.

---

## 8. API (FastAPI)

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness + mode (`deterministic`/`live`) + engine version |
| GET | `/samples` | list synthetic contracts and artists |
| POST | `/contracts` | create a contract from text or a sample id |
| POST | `/contracts/{id}/analyze` | extract clauses, run flag rules, return clauses + flags + trail + EN/SW text |
| GET | `/contracts/{id}/clauses` | clause list with severity |
| POST | `/contracts/{id}/simulate` | earnings simulation for N streams, both versions |
| POST | `/contracts/{id}/negotiate/start` | start session, returns round 1 proposal |
| POST | `/negotiations/{sid}/decide` | artist approves/rejects a concession; returns next round |
| GET | `/negotiations/{sid}/ledger` | full ordered moves |
| POST | `/works` | register a work (needs `consent_to_register`) |
| POST | `/licence/check` | request → `cleared / not-cleared / needs-consent` + trail |
| POST | `/passport/{artist}/issue` | build certificate + append ledger + issue badges |
| GET | `/passport/{artist}` | certificate(s), badges, score + reasons |
| POST | `/verify` | verify a certificate/ledger; returns intact or first broken record |
| POST | `/redlines` | set an artist's standing rule |
| GET | `/redlines/{artist}` | list rules with set-on dates |
| POST | `/chat` | "why?" question → explanation grounded in the stored trail (P1) |

Every analysis/verdict response includes `trail: [{rule_id, clause_numbers, facts, text_en, text_sw}]`.

---

## 9. Frontend (look and feel)

Design intent: calm, confident, warm. Think "well-lit studio desk", not "crypto dashboard". Big readable type, generous spacing, one accent colour per severity.

**Tokens:** ink `#1B1A17`, paper `#F6F1E7`, savanna green `#2F5D50` (cleared/primary), terracotta `#C4572D` (accent), gold `#D9A441` (badges), flag-red `#B3261E`, flag-amber `#B9770E`. Serif display (e.g. Fraunces) for headings, clean sans (e.g. Inter) for body. Respect dark mode with the same tokens inverted.

**Screens**
1. **Desk:** pick a synthetic contract (three big cards) or paste text; EN/SW toggle; permanent `SYNTHETIC DATA` banner.
2. **Clause Map:** the contract with highlights; a left rail summarizing "3 red, 2 amber"; click a highlight → **Trail Drawer** with rule id, clause number, plain-language meaning, "what it costs you", and (if relevant) the red line it breaks.
3. **Simulator:** stream slider, two bars ("as written" vs "after negotiation"), caption "illustrative".
4. **Negotiation Theater:** two columns (Artist agent, Label agent), each round a card; **Approve / Reject** buttons for each concession; a ledger strip at the bottom.
5. **Licence Desk:** request form with three one-click presets; the verdict card with the clause trail and named people ("Baraka, 40% composition, hasn't consented").
6. **Passport:** certificate card (hash shortened with copy), badge shelf, score ring + "Why this number" drawer.
7. **Verify:** paste/upload, big green/red result, the **tamper test** button for the demo.

Accessibility: keyboard navigable, visible focus, colour is never the only severity signal (add icons and text), captions for the video.

---

## 10. Synthetic data (write these carefully, they are the demo)

- **Artist Zawadi** (SYNTHETIC), singer-songwriter. Red lines: AI training never; term max 7 years.
- **Co-writer Baraka** (SYNTHETIC), 40% of the composition of "Asali ya Jioni".
- **Label Mawingu Records** (SYNTHETIC): policy with concession ladder; contract `c001` is the trap-heavy one.
- **Publisher Pwani Publishing** (SYNTHETIC): `c002`, mixed.
- **Kilele Collective** (SYNTHETIC): `c003`, mostly fair, shows Kabla doesn't cry wolf.
- Each contract is ~1–2 pages, plain language with realistic structure. The bad clauses (perpetuity, AI training, voice rights, no reversion, cross-collateral) are in `c001` with fixed clause numbers so fixtures match.
- Placeholder "audio/art" bytes are tiny generated files labeled `PLACEHOLDER`.

---

## 11. The demo, in three scenes (this drives the video and the e2e tests)

**Scene 1: Before you sign (≈0:40).** Zawadi pastes `c001`. Kabla highlights 5 flags. Click clause 7: "Allows the label to train AI on your recordings, forever. You told Kabla on 19 Oct: never." Show the simulator: under this deal she keeps X, after negotiation Y (illustrative).

**Scene 2: The negotiation (≈0:55).** Artist agent and label agent trade moves for 3–4 rounds, each with its reason. Zawadi approves some concessions and **rejects one**. The final terms appear with a diff against the original. Swahili toggle: the same trail in Kiswahili.

**Scene 3: The Passport and the three requests (≈1:05).**
1. Passport issued: hash, certificate, badges earned, score with "why".
2. **Request A:** a Kenyan brand wants the track in a 6-month ad → **cleared with conditions** (trail shown).
3. **Request B:** "train an AI model on this track" → **not cleared: AI training is opt-in only, and this artist's stance is never.**
4. **Request C:** sync for a Harlem exhibition film → **needs consent: Baraka (40% composition) hasn't consented.**
5. **Tamper test:** change one character in the certificate → Verify turns red and names the broken record.
6. Close: "Kabla — know what you're signing, prove what you own." plus what's next (Protect stage, Omega chat on feature phones via USSD/WhatsApp, a real BASIX marketplace hook).

Full beat timings go in `docs/DEMO_SCRIPT.md`. Video must be **≤ 3:00**, captioned, no real faces without written consent, no real data.

---

## 12. Omega integration plan (P1) and fallback ladder

1. In a scratch folder, install PeTTa and Omega (Docker or the manual steps in the Omega README). Confirm the agent starts and replies. **Do this early; it's the largest unknown.**
2. Read `Omega/docs/reference-plugin-api.md` and how existing plugins register skills (`loadOmegaPlugin`, `add-skill`). Copy the pattern exactly.
3. Expose skills: `kabla-analyze`, `kabla-licence`, `kabla-redline-set`, `kabla-explain`, each calling into the same engine modules the API uses (no logic duplicated).
4. **Red Lines memory:** use Omega's memory so a red line set in one session is applied to the next contract automatically and cited by date.
5. Optional channel: expose chat so the artist can ask "why was clause 7 red?" and the answer is built from the stored trail.

**Fallback ladder (decide honestly at each rung):**
- **L0 (always):** MeTTa rules on PeTTa + FastAPI + UI. Fully working product.
- **L1:** Omega plugin loads; at least one demo path (Red Lines memory) uses it live.
- **L2:** Omega chat channel answers "why?" from the trail.
- **L3:** NAL confidence for extraction, merged with Omega's own library.
- **L4:** testnet mint.
If L1 isn't working, README says "MeTTa on PeTTa; Omega integration is next" and links the partial plugin. **Never write "built on Omega" for something that isn't running.**

---

## 13. Testing and quality gates

- **MeTTa tests:** each rule has a positive and negative test (`engine/tests/*.metta`), run by `make test-metta`.
- **API tests (pytest):** bridge parses engine output; each sample contract yields the expected flags (golden files); negotiation reaches expected end states; passport hash/verify round-trips; tamper test fails verification; score matches hand-calculated examples.
- **E2E script:** runs Section 11 scenes headlessly and writes transcripts into `docs/transcripts/`.
- **Clean-clone gate:** `scripts/verify_clean_clone.sh` clones into a temp dir, runs setup + tests. Must pass before submitting.
- **CI:** GitHub Actions running lint, pytest and metta tests on every push.
- **Security hygiene:** no secrets, dependency licences listed in NOTICE, no real personal data, synthetic banner visible.

---

## 14. Commit plan (target 50+ commits)

Push after each phase. Messages in conventional-commit style.

**Phase A: foundation (≈8)**
1. `chore: init repo from BASIX hackathon starter, add LICENSE and NOTICE`
2. `docs: add build spec and decisions log`
3. `docs: add AI_DISCLOSURE, LIMITATIONS, SUBMISSION checklist skeletons`
4. `chore: add gitignore, env example, Makefile`
5. `chore: add scripts/setup_petta.sh and verify PeTTa runs hello-world`
6. `feat(engine): schema.metta with documented atom shapes`
7. `chore: add CI workflow (lint + tests placeholders)`
8. `docs: record Omega install findings in DECISIONS.md`

**Phase B: synthetic data (≈5)**
9. `data: contract c001 (trap-heavy) with SYNTHETIC banner`
10. `data: contract c002 (mixed)`
11. `data: contract c003 (mostly fair)`
12. `data: extraction fixtures for c001–c003`
13. `data: synthetic artists, works, policies`

**Phase C: rule engine (≈10)**
14. `feat(engine): clause vocabulary and severities`
15. `feat(engine): R-GRANT-01 and tests`
16. `feat(engine): R-AI-01, R-AI-02 and tests`
17. `feat(engine): R-VOICE-01, R-REVERT-01, R-XCOLL-01 and tests`
18. `feat(engine): R-TERM-01 with redline interaction and tests`
19. `feat(engine): R-OPT-01, R-AUDIT-01, R-SYNC-01, R-SPLIT-01 and tests`
20. `feat(engine): licence verdict rules with trail`
21. `feat(engine): consent tracking and needs-consent verdict`
22. `feat(engine): earnings simulator`
23. `docs: RULES.md generated from rule ids and messages`

**Phase D: API (≈9)**
24. `feat(api): FastAPI skeleton, config, health endpoint`
25. `feat(api): pydantic models`
26. `feat(api): metta_bridge writes facts and parses results`
27. `test(api): bridge golden tests for c001–c003`
28. `feat(api): extractor with fixture mode`
29. `feat(api): extractor live mode (LLM) behind flag`
30. `feat(api): analyze endpoint with trail`
31. `feat(api): i18n templates EN/SW and glossary`
32. `feat(api): licence check endpoint`

**Phase E: negotiation (≈5)**
33. `feat(engine): negotiation concession ladders and policy loader`
34. `feat(api): negotiation session and decide endpoints`
35. `test: negotiation reaches agreed/standoff/walk-away`
36. `feat(api): negotiation ledger and transcript export`
37. `docs: NEGOTIATION.md with worked example`

**Phase F: Passport (≈7)**
38. `feat(api): work registration with explicit consent flags`
39. `feat(api): sha256 hashing and certificate builder`
40. `feat(api): hash-linked ledger and Ed25519 signing`
41. `feat(api): verify endpoint and tamper detection tests`
42. `feat(engine): score rules and tests`
43. `feat(api): badge issuing (Open Badges v2-shaped)`
44. `docs: PASSPORT.md with formula and examples`

**Phase G: frontend (≈10)**
45. `feat(web): Vite + React + Tailwind scaffold, theme tokens`
46. `feat(web): Desk page and sample cards`
47. `feat(web): Clause Map with highlights`
48. `feat(web): Trail Drawer`
49. `feat(web): Simulator`
50. `feat(web): Negotiation Theater`
51. `feat(web): Licence Desk with presets`
52. `feat(web): Passport page, badge shelf, score ring`
53. `feat(web): Verify page with tamper test`
54. `feat(web): EN/SW toggle, synthetic banner, accessibility pass`

**Phase H: Omega (≈5, P1)**
55. `feat(omega): plugin skeleton loads in Omega`
56. `feat(omega): kabla-analyze and kabla-licence skills`
57. `feat(omega): Red Lines memory skill`
58. `feat(omega): chat explain skill from stored trail`
59. `docs: OMEGA integration status in README (honest)`

**Phase I: polish and ship (≈6)**
60. `test: e2e script for the three demo scenes, write transcripts`
61. `docs: DEMO_SCRIPT.md and record checklist`
62. `docs: README first screen, one-command run, architecture diagram`
63. `chore: verify_clean_clone.sh passes`
64. `docs: finalize AI_DISCLOSURE.md and LIMITATIONS.md`
65. `chore: tag v1.0-hackathon`

---

## 15. Documentation required (counts toward the score)

- **README (first screen):** name, one-line pitch, track + stage, solo/team, one-command run, video link, screenshot or GIF.
- Sections: Problem, Solution, How it works (diagram), Technology (MeTTa/PeTTa/Omega status stated honestly), How to run, How to test, Team, AI Disclosure link, What's next, Limitations, Credits.
- **AI_DISCLOSURE.md:** tools and what each did (e.g. coding agent for scaffolding, LLM for extraction in live mode, which parts were human-written).
- **BUILD_LOG.md:** short dated entries.
- **Transcripts:** the reasoning transcripts and ledger exports from the demo.
- Share the repo with BASIX reviewers; confirm institution (or "Independent") on the BASIX profile.

## 16. Definition of done

- [ ] `make setup && make run` from a clean clone works; `make test` is green.
- [ ] All three contracts produce the expected flags with correct rule ids and clause numbers.
- [ ] Three licence requests give cleared / not-cleared / needs-consent with named people.
- [ ] Negotiation completes in ≤4 rounds with the artist approving each concession.
- [ ] Passport verifies, and the tamper test fails verification.
- [ ] Score reasons add up exactly; no artist comparison anywhere.
- [ ] EN and SW explanations render for every rule.
- [ ] README states Omega status truthfully.
- [ ] Video ≤ 3:00, captioned, shows it working, says what's next.
- [ ] Rule 10 (IP/commercial pathway) read and understood by the human before submitting.

## 17. Open questions for the organisers (ask early)

1. Is a License-stage build whose output includes a certificate, badge and score acceptable under "build one stage"?
2. Is my track already locked from Day 1 and which one am I in?
3. Does the repo need to be public or shared with a specific BASIX GitHub account?
4. Is a hosted live demo required or is the video enough?
