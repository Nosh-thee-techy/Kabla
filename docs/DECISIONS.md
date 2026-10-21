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


## 2026-10-20 - Omega: partial load, stated precisely

Docker image could not be pulled (about 2.3 GB, slow link, low disk), and the full agent needs torch and chromadb. Instead scripts/omega_native.py stages Omega's source (cloned, Apache-2.0) under PeTTa repos/ and runs Omega's own config, logger, plugin-listing and skill-registry modules. Omega's loadMettaPlugin returned without registering the skills on this Windows setup (cause not found in the time box), so the harness performs its three steps by hand: add the folder to sys.path, import the plugin .metta, call loadOmegaPlugin. Result in docs/evidence/omega-load.log: four skills registered in Omega's registry; kabla-redline-set then kabla-analyze on c001 and c002 shows red lines carried with their set dates. Not claimed: the Omega agent loop, memory, LLM, channels, or 'built on Omega'. Also learned: the Python helper must not share the plugin .metta's basename (renamed kabla_skills.py).




## 2026-10-21 - Onboarding came back into scope (team asked for it)

The 20 Oct scope note dropped onboarding for the 23:59 deadline. On 20 Oct night the team asked for it again, and the deadline moved to Wed 21 Oct 23:59 EAT, so it was built: a Before step (`/onboard`) where an artist types a name, handles, a short bio and ticks a consent box. Nothing is scraped; handles are text. A visible regex reader pulls works and splits from the bio, `engine/profile.metta` (a new file; no existing rule or weight touched) lists the gaps, and the profile is sealed in its own Ed25519 hash chain. Wording is "self-declared, consent-recorded, hash-sealed", never "verified". README therefore says "License, plus a Protect-lite Before step" and not Protect or Earn.

Why a separate seal chain: the passport ledger's verifier expects certificates, and changing it was outside the brief. Why typed profiles only carry facts and gaps: the passport, financier and verify rooms are built around one synthetic work; carrying a new catalogue through them is in docs/NEXT.md.

## 2026-10-21 - Omega agent loop runs natively on Windows (what was patched, what is still not true)

Result: the real Omega loop (`(omega)` from Omega `main`) runs on PeTTa v1.0.4 with Kabla's plugin, memory (history file + Chroma, local MiniLM embeddings), and a Kabla chat channel; five chat turns through `POST /omega/chat` returned correct answers from Kabla's MeTTa-backed skills (docs/evidence/omega-chat.md, omega-agent-excerpt.log). Not true: it is not an LLM (no key was set; the provider is a labelled keyword router), it has no sandbox, and the web product does not depend on it. We do not claim "built on Omega".

What it took, all in the staged copy under `.vendor/` (never in upstream Omega): (1) PeTTa **v1.0.4**, the version Omega's Dockerfile pins, in its own checkout, because the project's engine pin `fea83178` raised "Type mismatch: got true but expected List" inside Omega's init code (dropping any one of eight `configure` calls made it pass; cause not found, so the pin was not changed for the product). (2) Omega's `lib_omega.metta` imports were written out as direct paths (`omega-plugin/demo/kabla_agent.metta`) because `(library Omega ...)` did not resolve. (3) A `py_landlock` stub with plain-int flags, because Landlock is Linux-only; `securityPolicyPath` is empty, so Omega runs with its restrictions off. (4) The local embedding model name is read from `OMEGA_EMBED_MODEL` (default `all-MiniLM-L6-v2`, ~90 MB) instead of the hard-coded 1.3 GB e5-large-v2, because of this network; recall quality is lower. (5) PeTTa's `lib_llm.metta` builds an OpenAI client at import, so with no real key a placeholder is passed and `KABLA_OFFLINE_ONLY=1` makes Kabla's provider ignore it. (6) The repo root of the staged copy is put on `PYTHONPATH` because Omega's providers import `src.logger`.

Safety nets (asked for because calls may be slow, asleep or dead): every model call has a hard wall-clock budget (default 45 s), one retry and a circuit breaker (3 failures, 2 min cool-down), then falls back to the offline router; skills time out at 60 s and return an error line; `scripts/omega_run.py` restarts the agent if its log is silent for 5 minutes (max 5 restarts); the API chat never waits on the agent and reports agent up/down from a heartbeat file; the web panel polls. Unit tests cover offline routing, timeout fallback and the circuit breaker (`omega-plugin/tests/test_llm_provider.py`). The live-model request code (OpenAI-style and Anthropic-style) has **not** been run against a real endpoint.




## 2026-10-21 - Live model on the Omega chat: the model phrases, it does not choose

The team gave an OpenRouter key for an NVIDIA Nemotron model (key only in the git-ignored `.env`; it was pasted into a chat window, so it should be rotated). The provider already spoke the OpenAI wire format, so only `OMEGA_LLM_URL=https://openrouter.ai/api/v1` and a model name were added. Models checked first with one forced tool call: `nemotron-3-super-120b-a12b` and `nemotron-3.5-lightning` worked; the `:free` super endpoint returned a provider 404.

Attempt 1, the model picks Omega's tools (as in stock Omega): the loop worked but the agent wandered. With two different Nemotron models, replies lagged one message behind, it queried memory instead of answering, asked a clarifying question about an unambiguous request, and, left alone, sent unprompted messages and hit HTTP 429 from about six calls a minute. Smoke result 2 to 3 of 5.

Attempt 2 (kept): Kabla's own rule, "MeTTa decides, the LLM reads and phrases", applied to the provider. (1) A keyword router picks the Kabla skill, no model call. (2) When the skill returns, the model rewrites the one-line DIGEST in plain words. (3) Its reply is used only if it keeps every rule id, adds no number that is not in the engine's text or the question, and does not echo its own instructions or planning; otherwise the raw result is relayed, labelled "[offline router, not an LLM]". (4) Anything the router does not recognise gets a short persona answer from the model, vetted the same way. (5) Idle loop ticks return `nop`, so an idle agent makes no model calls. (6) Timeout, one retry, circuit breaker and the offline fallback are unchanged. For OpenRouter only, `reasoning: {enabled: false}` is sent: without it Nemotron put its planning in the reply on about half of long prompts (caught by the vet, but the fallback then showed raw text); with it a probe was clean 6 of 6 and faster.

Result: 5 of 5 chat turns live, 6 to 12 s each (docs/evidence/omega-chat.md). The smoke check had two bugs found on the way, both fixed: it compared reply-list length although the API only returns the newest 20, and its expected words were the offline router's fixed wording. Honest limits: the check is "grounded in the skill's output" by a few key words, not a quality score; five turns is a smoke test; vetting uses regexes and will sometimes reject good phrasing (it falls back safely); the live extractor for pasted contracts (`KABLA_MODE=live`) was not run with this model. Customer data sent to the model is synthetic only.

## 2026-10-21 - Reload keeps your place; live contract reading tried with Nemotron

Reload: the open contract, analysis, negotiation, licence verdict, passport, verify result and profile are now kept in sessionStorage (`web/src/state.tsx`), and the language in localStorage. sessionStorage, not localStorage, so a new tab or a shared computer starts clean at Before. Every storage call is wrapped, so blocked storage just means "forgets on reload" as before. Browser check row 03b reloads on the clause map and confirms the analysis and the sealed profile survive (13 of 13 rows pass).

Live reading: the API extractor can now talk to any OpenAI-compatible server (`KABLA_LLM_URL`), which is how Nemotron 3 Super via OpenRouter was tried. `scripts/live_extract_check.py` feeds each sample contract as raw text to the live reader and compares it with the human-reviewed fixtures: 24 of 30 clauses reproduced, misses and wrong numbers listed in `docs/evidence/live-extract.md`. A model still only reads clause facts; the vocabulary check drops anything outside the engine's terms (one clause per sample was dropped) and MeTTa decides every flag. Not safe to rely on without the roadmap's "please confirm this clause" step, so the README keeps deterministic fixtures as the demo path and says live reading is experimental.

A bug found on the way: `.env` loading used `setdefault`, and `.env` starts as a copy of `.env.example` with empty keys, so the first empty line beat a real value added below it. Now empty values are skipped, the last non-empty line wins, and real environment variables still take priority (`api/tests/test_config_dotenv.py`). One extractor test now pins its provider so a developer's own `.env` cannot change it.