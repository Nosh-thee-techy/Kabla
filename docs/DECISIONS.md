# Decisions log

Dated decisions and every place where we had to correct a sketch from `docs/BUILD_SPEC.md`.
Newest entries at the bottom.

## 2026-10-19 — Starter BRIEF.md is stale

`BRIEF.md` (copied from `BASIXmarket-io/hackathon-starter`) lists 3 tracks and a different
deadline and judging weights. We follow the official Hacker Pack and BASIX.MARKET
announcements: **Track 4 (BASIX.MARKET Builds), Brief B (Managing originals: Art IP and
Music IP), stage: License.** BRIEF.md is kept unmodified for provenance.

## 2026-10-19 — Engine runtime: PeTTa on native Windows SWI-Prolog

- SWI-Prolog 10.0.2 (x64-win64) installed via winget. PeTTa (`trueagi-io/PeTTa`, MIT)
  runs natively: `swipl -q -s PeTTa/src/main.pl -- file1.metta file2.metta --silent`.
  `run.sh` is just a thin wrapper around that command, so the bridge calls `swipl`
  directly and works on Windows, Linux and macOS without `sh`.
- `--silent` (or `silent`/`-s`) suppresses the compiler trace. Results of `!(...)`
  expressions are printed at the end; `println!` prints immediately.
- Several `.metta` files can be passed and are loaded **in order** into the same `&self`.
  The bridge uses this: rule modules → per-request `facts.metta` → query file.
- Measured cost: ~1.2 s PeTTa startup, ~2 s for a rules+facts+query run. Acceptable for a
  subprocess-per-request bridge; no persistent process needed.

## 2026-10-19 — Fix to the §6.2 sketch: function names vs. result constructors

The sketch `(= (flag $c $n R-GRANT-01 red) (match ...))` does not work in PeTTa. Once a
symbol has an `=` definition, PeTTa treats it as a **function everywhere** and checks the
arity of every occurrence; using `flag` as a 4-ary data constructor in another clause
fails at load time with
`Domain error: function_input_arities(flag,[1,2]) expected, found 4`.

Fix: rule functions and result constructors use different names. Rules are
`(= (flags-of $c) (match &self (clause ...) (flag $c $n R-GRANT-01 red)))`, one `=` clause
per rule; `(collapse (flags-of c001))` gathers all flags. `flag` stays pure data.

## 2026-10-19 — Omega recon

- Upstream is `singnet/Omega` (Apache-2.0), pinned at `1a7624e`. Plugin API
  (`docs/reference-plugin-api.md`): a MeTTa module exposing `loadOmegaPlugin`, listed in
  `config/plugins.yaml` with `loader: metta`; skills are added with
  `(add-skill fn "description" (args))`. Examples: `plugins/workflow`, `plugins/openclaw`.
- Omega ships `mockprovider` and `mockchannel`, so plugin loading can be exercised without
  an LLM key. The full agent needs `janus-swi`, torch, chromadb and an LLM key. That is
  heavy on Windows, so Omega work is scheduled after the L0 product (fallback ladder §12).
- `lib_nal.metta` lives at the Omega repo root (not needed for P0).
- Omega's documented install path is Ubuntu (apt build-essential, python3-dev, janus-swi)
  or Docker (`singularitynet/omega` image). Plan: attempt plugin load in WSL/Docker after
  P0, record the result here, and state the real status in README.

## 2026-10-19 — PeTTa builtins verified for the engine design

Prototyped before writing rules (all confirmed on PeTTa `fea8317`):
`!(import! &self ./sub/mod.metta)` resolves relative to the importing file;
recursive rules over `match` (region containment KE ⊂ EA ⊂ AF ⊂ WW) work;
`collapse`, `foldl-atom` with an inline lambda, `size-atom`, `is-member`, `car-atom`,
`let*`, `and`, `max`, float arithmetic all work. Booleans print as `true`/`false`.
Symbols such as `R-GRANT-01`, `12-percent` and `2026-10-19` stay symbols.

Output convention: every query is `!(result <tag> <values...>)`; `result` is never
defined as a function, so PeTTa evaluates the arguments and prints the whole expression.
The bridge ignores any line that does not start with `(result `.

## 2026-10-19 — PeTTa stdout encoding on Windows

`swipl` on Windows may emit Latin-1 (byte `0xA7` for `§`) even when source files are UTF-8.
The bridge (`metta_bridge.py`) therefore decodes PeTTa stdout as UTF-8, then cp1252, then
Latin-1, so clause refs like `"c003-§6"` round-trip on every platform.

## 2026-10-19 — R-VOICE-01 narrowed to synthetic voice

The §6.2 sketch fires R-VOICE-01 on `(voice-likeness granted $x)` for any `$x`. That
would flag c003's "name and approved photographs only to promote the Recordings", which
is standard and fair, and Kabla must not cry wolf. R-VOICE-01 fires on
`synthetic-voice` only; `promo-only` is recorded but not flagged.

## 2026-10-19 — Task runner instead of bare make

The dev machine is Windows without `make`. `Makefile` targets delegate to
`scripts/tasks.py`, so `make test` (Linux/macOS/CI) and `python scripts/tasks.py test`
(Windows) do the same thing.

## 2026-10-19 — Omega not loaded; L0 is the product

Plugin sources (`omega-plugin/kabla_plugin.metta`, Python HTTP helpers) are in the
repo and define `loadOmegaPlugin` plus four skills. They have **not** been loaded
in a live Omega agent here. README, health endpoint and `scripts/setup_omega.py`
all say **MeTTa on PeTTa**. Docker Compose does not start Omega.

## 2026-10-19 — setuptools forbids api/../README.md

`api/pyproject.toml` pointed `readme` at `../README.md`. A clean clone then
failed `pip/uv install -e api` because setuptools will not read files outside
the package directory. The project README stays at the repo root; the package
metadata no longer references it.

## 2026-10-19 — Passport terms vs standing red lines

Issuing a passport used to copy the artist's red line value `never` into
`terms.ai_training`. The licence engine only understands `opt-in-paid` /
`prohibited` / `granted` on that slot; `never` lives on `(redline … ai-training never …)`.
Copying it made Request B return `needs-consent` (R-LIC-AI-OPTIN) after a passport
was issued. Fix: agreed terms stay `opt-in-paid`; stance is stored as `ai_stance`.

## 2026-10-20 — Financier view reuses existing facts

A backer sheet (`GET /passport/{artist}/financier`) rearranges owners from
`w-asali`, flags from `analyze()` on stored contracts, the standing AI red line,
consent gaps from the existing licence probes, and `score()`. No new MeTTa
rules and no new scoring weights. The journey rail stays seven rooms; the
sheet is linked from Passport.

## 2026-10-20 — Red-line carry-over already worked

`analyze()` always loads `store.list_redlines(artist)` (artist-scoped, not
contract-scoped). c001 then c002 already cited `2026-10-19`. The only change
is surfacing `redline_set_on` as "You set this on <date>" on the clause-map
trail. No engine change.

## 2026-10-20 — Local hosting sketches stay untracked

`Dockerfile`, `fly.toml`, `railway.toml` and `web/vercel.json` are gitignored.
They are not a durable host and are out of the License-stage demo.

## 2026-10-19 — Docker PETTA_HOME

Compose must use `/app/.vendor/PeTTa` (where `setup_petta.py` clones inside
`Dockerfile.api`). An earlier `/opt/petta` path would miss the engine. The web
image proxies `/api/` to the api service so the browser stays same-origin.

## 2026-10-20 — Clause-map compaction and design pass in one commit

The slim flag strip and the room redesign touch the same files (ClauseMap,
Theater, i18n). Splitting them would mean committing an intermediate state
that was never built, so they ship as one web-only commit. No API, rule or
scoring file changed.

## 2026-10-20 — Karani's voice goes through the API, and is optional

The team asked for the desk clerk to speak using ElevenLabs. The key never
reaches the browser: the web app POSTs the line to `/voice` and the API calls
the provider, caching each distinct line as mp3 under `var/voice/` (git-
ignored). With no `ELEVENLABS_API_KEY` the endpoint answers 503, the web app
falls back to the browser's own speech synthesis, and nothing else changes.
Tests never touch the network. Naming the provider in config and this note is
unavoidable since the team chose it; it is not a comparison or an endorsement.
Lines are capped at 400 characters to bound spend. Voice reads Karani's
guidance only; it does not read contract text or anything MeTTa decided.

## 2026-10-20 — Karani interrupts once per state, not once per render

The clerk card pauses the room the first time a given cue is seen in the
browser session (`karani-seen` in sessionStorage), e.g. `theater:open:2`.
After that he waits in the corner. Voice auto-read is off by default and is a
per-browser preference, because autoplay before the first click is refused by
browsers and because a judge may be watching with sound off.

## 2026-10-20 - Tonight's scope for the 23:59 deadline (confirmed with the team)

Kept: pasted-contract clear errors, end-to-end fixes, one time-boxed attempt to load the Omega plugin, docs and SUBMISSION walk. Dropped to docs/NEXT.md: onboarding from pasted bio and handles (consent, no scraping), profile token, testnet smart contract, public hosting. The team's earlier word 'contracts live' was read as smart contracts; the pasted-legal-contract reading needs an LLM key in .env and is documented as such.

## 2026-10-20 - Omega attempt and honest status

The Omega image is about 2.3 GB and this network gave about 1 MB/s, so the download alone took over 90 minutes. README keeps saying the plugin is NOT loaded unless docs/evidence/omega-load.log exists and shows 'kabla-plugin loaded' and 'KABLA-DEMO done'. No claim of 'built on Omega' is made without that log.

## 2026-10-20 - Open admin question

Synthetic-only demo: confirm that invented contracts (no Incantio, HFAS, Harlem CLxR or AI for Peace data) are fine for Brief B. Record the organisers' answer here when received.

