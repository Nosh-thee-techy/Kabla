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

## 2026-10-21 - Public demo on Fly.io (supersedes "Local hosting sketches stay untracked")

The team asked for a public URL, so the hosting files are now tracked: `Dockerfile` (UI + API + PeTTa in one image), `fly.toml`, `railway.toml`. Deployed to https://kabla-desk.fly.dev, app `kabla-desk`, region `jnb` (closest to Nairobi), one shared 1 GB machine that sleeps when idle, with a 1 GB volume mounted at `/data` so the SQLite store and the signing keys survive sleeps and redeploys (without it every start would reset and an open demo would break). Deterministic mode and **no API keys on the host**: the public site never calls a model, so there is nothing to leak or run up a bill. The Omega agent is not hosted, so the chat panel honestly shows it offline.

A gap found by deploying: the earlier "SPA and /api prefix" support was never in the code, so the first deploy answered 404 on every path. Fix: `api/kabla/web.py` mounts the existing app under `/api`, serves `web/dist` for everything else with an index.html fallback (so a reload on `/map` works), and falls back to the plain API when no UI is built. Tests and local dev still use `kabla.main:app` unchanged. The engine on the host is the same pinned PeTTa commit (`/api/health` shows `fea83178af37`). Browser check against the live URL: 13 of 13 rows (`docs/evidence/e2e-fly.md`).

Costs and limits: Fly needs an account (done by the team) and may bill small amounts (machine time, volume); sleeping keeps that near zero. Anyone with the URL can use it and create demo profiles; there is no login or rate limit, which is acceptable only because all data is synthetic and nothing sensitive is stored. If it needs to come down: `fly apps destroy kabla-desk`.

## 2026-10-21 - Plainer words in the simulator and the how-to cards

The team found the simulator copy hard to read ("streams", "illustrative", "recoup", "rule trail", "customs"). Rewritten in everyday English: plays instead of streams, "Example numbers with made-up rates", "What you keep", "Advance still to pay back", Karani is "your guide" instead of "desk clerk", and every how-to card says what to do in plain sentences. Swahili was updated only for the simulator and Karani's label and is still AI-drafted, so a fluent speaker should review it; the other Swahili how-to cards still carry the older wording. No logic or numbers changed. The browser check now looks for "Example numbers" in the simulator (13 of 13 pass).

## 2026-10-21 - Theater as a stage: curtain, clerks, tug-of-war bars, stamped cards, ending scene

The Theater was a list of forms. It is now a small show, built only from data the API already returns (no engine, scoring-weight, readiness or MeTTa-rule changes; no new dependency; no API change).

- **Curtain and stage.** A closed curtain carries the "Raise the curtain" button. When the round starts it opens on two clerks, yours and the label's, each with a speech card built from the topic being looked at ("My red line on AI training: never." / "Our offer: only if you say yes, and you are paid."). When the negotiation ends the curtain comes down again with the state word (agreed, standoff or walk-away).
- **Tug-of-war bar per topic.** A dot is what the contract says now, an "L" token is the label's offer, a flag is your ask (your red line when the engine marks it so). Numbers are placed to scale between "now" and "your ask". Words (for example "opt-in-paid") have no scale, so the token sits at the contract end, at your line if it equals your ask, and in between otherwise; the bar says nothing more precise than that. An offer on a red-line topic that has not reached your line turns the bar and the card red and shakes it three times. This is a drawing rule in `web/src/lib/tug.ts` (`is_redline` and offer is not your ask), not a second opinion on the engine.
- **Contract cards.** Each counter-offer is a card; the one to look at next is spotlighted, undecided cards are dimmed, Approve/Reject plays an ink stamp, and after you stamp the round each card keeps AGREED or REJECTED. The old "Ask / Offered / Advice" lines and the engine's own policy line are kept; the advice word and values are shown as plain phrases ("hold-redline" becomes "Hold firm: this is your red line.").
- **Readiness.** The two numbers count up or down with a +/- chip, and a small line lists each round ("Start", "Round 1", ...). "Tap a number for why" is unchanged. The trail is kept in sessionStorage (same lifetime as the rest of the demo state); a slow answer is still recorded under the round it was asked in.
- **Ending scene.** "Ledger: who gave up what" (label gave up / you gave up / still open), a before-and-after card, the readiness change, "Kabla never agrees for you", and a button to the licence desk. "Before" is a copy of round 1 kept in sessionStorage, because the API overwrites a topic's current value when you approve a counter. If a visitor reloads on a later round in a tab that never saw round 1, the Before column shows a dash.
- **Polish.** "Round X of Y" with pips; warm lamp glow and a spotlight cone; works down to 390 px wide; `prefers-reduced-motion` turns off every animation and the curtain just switches state; always the dark night-desk style.
- **Words.** New copy is plain ("Contract says now", "Label offers", "Your red line"; no "closer", "concession" or "MeTTa"). EN and SW keys are kept in step (the TypeScript build fails if one is missing). **The Swahili is AI-drafted and has not been checked by a fluent speaker**; it is the first thing to review. "Act" became "Round" in the clerk lines so the page uses one word.
- **Found on the way.** On a phone the journey rail made every room 900 px wide, which pushed Karani's card off screen; fixed with `min-w-0` on the rail's wrapper and `relative` on its nav.

Browser check: the click-through now also saves three Theater screenshots (before the curtain, mid-round, curtain down) and waits for the ending scene; all 13 rows pass. Honest limits: the demo contract's readiness numbers hardly move until the deal ends (the "after" number jumps at the end), so the +/- chip is exercised in the browser with a test-only mocked response, not by the live demo; the tug bar is a picture, not a measurement.
## 2026-10-21 - Theater: one card at a time, simpler words

The Theater showed every counter-offer at once, so it was hard to tell which one was being talked about. Now only one card is in the light.

- **Focus.** The card being discussed is big and sharp, with the Approve and Reject buttons. Cards still waiting are blurred and cannot be clicked ("Next in line"). Answering stamps the card, slides it down into a small answered pile, and the next card pops up in the light. "Change my answer" on an answered card puts it back in the queue. The slide is a small FLIP animation in Theater.tsx; it is skipped with prefers-reduced-motion.
- **Order and rules unchanged.** Same decisions go to the same API call; anything left unanswered is still sent as approved (the page still says so). No engine, scoring or readiness change.
- **Simpler words.** Advice, values and labels rewritten in everyday language ("Say no. This is your red line.", "an AI copy of your voice", "only with your OK, and paid", "the label can extend 3 times", "Offers from the label"). The engine's policy line (for example "Mawingu policy 2.1 - ...") moved behind a small "Why this advice?" fold on the focused card. **New Swahili strings are AI-drafted and need a fluent check; most existing Swahili value/advice phrases were left as they were.**

## 2026-10-21 - Sign check: the readiness block gets its own room

The bottom of the Theater was a long raw list (rule ids, "Already true" lines, a tiny trail) with no order. It is now a separate page, `/check`, "Sign check", between Theater and Licence desk in the journey rail (and in Karani's how-to steps).

- **Fixed order.** (1) Two big numbers, "As written" and "After negotiation" (or "Best case" before any round), with the difference and one plain sentence. (2) "What is holding it back": only items that cost points, one card per kind (for example "6 times, -10 points each, -60"), a one-line "How to fix", and for red warnings the clause and its title. (3) "Already in good shape": collapsed by default. (4) "Before you sign": tick rows (warnings only). (5) "Round by round": a labelled line chart (Start, Round 1, ...) on a 0-100 scale.
- **Raw rule ids** (for example `licence-missing-consent`) are not in the main view; each card has a small "Details" fold that lists them with the event ids.
- **"Tap a number for why"** is now a switch: tap "As written" or "After negotiation" and the lists below show the reasons for that number.
- **Theater** keeps only a compact card (the two numbers, the difference, and a "See your sign check" button). The curtain-down ending scene and its "Go to the licence desk" button are unchanged.
- **Nothing new decided.** Only fields the API already returns are used; scoring, readiness rules and MeTTa are untouched. The "How to fix" sentences are fixed text per kind of reason (two kinds cost points today); a new kind falls back to the API's own sentence with no fix line. The trail is read from the same sessionStorage key the Theater writes (`kabla:trail:<contractId>`), so a new tab shows an empty chart until a round is played.
- **Words.** Plain English; **the Swahili strings for this page are AI-drafted and have not been checked by a fluent speaker.**

## 2026-10-21 - Passport split into two rooms: Register and Your passport

Getting ready to register and holding the issued passport are two different jobs, and a preview card beside the form was confusing. The old `/passport` room is now two pages.

- **Register (`/passport`, rail step "Register").** Only: the "Before you sign" ready-check (warnings only), a short plain note on what registering does (a dated, tamper-evident record of agreed terms; evidence, not a legal instrument; SYNTHETIC demo data), a consent line, the "Also list for sale" tick and the "Register this work (I consent) -> Issue passport" button. On success it goes to the next page. If a passport already exists it shows a small "View your passport" link. The button label, the register call (`POST /works`) and the issue call (`POST /passport/<artist>/issue`) are unchanged.
- **Your passport (`/passport/issued`, rail step "Passport").** Fixed order: passport card (SYNTHETIC label, title, hash with Copy, the four stamps), score ring, "Why this number" (a switch; long lists scroll), "Next best steps", then "Open the financier view" and "Back to Register". It makes no API call; it reads the passport kept in sessionStorage (`kabla:passport`), so it survives a reload. With no passport it shows an empty state with a button back to Register.
- **Rail.** One new step, so the numbers after Licence desk shift by one. A nested route no longer lights up its parent step (exact step match wins).
- **Nothing else changed.** Scoring, readiness, MeTTa and the API are untouched. The browser check now has rows 07 (register) and 07b (page 2, with a full-page screenshot and a reload); `scripts/shots_passport.mjs` takes desktop and 390px screenshots of both pages and the empty state.
- **Words.** Plain English. **The Swahili strings for these two pages are AI-drafted and have not been checked by a fluent speaker.**

## 2026-10-21 - Landing page and a demo sign-in (no real accounts)

The first screen used to be the "You" room (a form), which asked for a name and links before the visitor knew what Kabla was. `/` is now a landing page; the Desk moved to `/desk`.

- **Landing (`/`).** Plain words, dark "night desk" look: what Kabla is in one sentence (it reads a music contract with you, shows the risky parts in plain words, helps you ask for fairer terms; you decide, Kabla never agrees for you), Before / During / After as three numbered cards, "What Kabla is not" (not a lawyer, not a signer, demo uses made-up data only), and two actions, "Start" and "Sign in". The journey rail is hidden on the front-door pages (`/`, `/signin`, `/welcome`).
- **Demo sign-in (`/signin`) is not an account.** A display name (required) and a contact (optional, never validated or used) are kept as `kabla:account` in sessionStorage through the same helper as the other state (`web/src/state.tsx`). No password, no network call, nothing in the API or the database. The page says so in these words: "Demo sign-in: stays on this device, no password, no real account", and next to it "Real accounts: planned next". "Sign in" with nothing stored says there is nothing to look up; it does not pretend to find anyone. "Sign out / start fresh" (header chip, and on the sign-in page) removes every `kabla:*` sessionStorage key and resets all in-memory state (row 11 of the browser check proves it).
- **Why no real auth.** Passwords, email verification and a user database are a whole product (hashing, reset flow, abuse limits, a privacy policy, deleting a person's data on request) and would collect real personal data in a Track 4 Brief B demo whose rules are synthetic data only. It is out of scope for the 23:59 EAT deadline. The BRIEF.md in this repo is the generic starter (it lists no Track 4 file; `tracks/` is not in this repo), so the scope comes from the Hacker Pack decision logged on 2026-10-19: Track 4, Brief B, License stage.
- **What real auth would need** (listed in `docs/NEXT.md`): a user table and sessions on the API, a magic-link or OAuth sign-in (no passwords to store), consent and deletion flows, per-user ownership of profiles and passports (today a profile is keyed by the artist name and the demo fixtures are shared), rate limits, and a privacy notice. Until then the sign-in only decides what name the demo greets.
- **Set-up wizard (`/welcome`).** Step 1 About you (name, artist or band name, EN/SW), step 2 Where your music lives (the same five typed fields), step 3 Your catalogue (the same bio box, with "Mwanga is 50% mine" as a labelled placeholder, the same consent line), then Ready. The last step makes the **same call** as the You room (`POST /artists`, `api.createArtist`) and stores the **same Profile** (`setProfile`), so the Desk, the seal check and every later room read it as before. The wizard is honest that this step sends the typed text to the demo server to seal it; only the sign-in stays on the device. The You room (`/onboard`, rail "You") stays as the way to edit the profile.
- **Nothing else changed.** No scoring, MeTTa or API change; no new dependency. Old links to the Desk now read `/desk` (`/desk?sample=c001` is the demo jump). **The new Swahili strings are AI-drafted and need a fluent-speaker check.**

## 2026-10-21 - Plainer words on every card

The cards used short, dense lines ("Rights-health", "Take it to customs", "red line", rule titles such as "R-AI-01"). A working musician with no legal or tech background should be able to read each one and know what it means and what to do.

- **Rewritten:** the card text across Desk, Theater (topics, value words, advice, tug-bar captions, policy fold), Sign check, Register, Your passport (stamps, why, next steps), Licence desk, Financier, Verify, Karani's guide lines and the checklist. Short full sentences, everyday words, about grade 6. A term that cannot be avoided is explained once in a few words (for example "Reversion: when your rights come back to you"). "Red line" is now "your limit".
- **API text is untouched.** Flag titles and meanings, policy lines, checklist items, score reasons, next steps, backer risks and licence conditions still come from the API, the MeTTa files and the ledger exactly as before. `web/src/plain.ts` maps them (by rule id, topic, key or the exact original line) to plain wording, each entry a `{ en, sw }` pair so a missing Swahili line is a type error. If nothing matches, the original text is shown. The original technical text sits behind a small "Show the exact rule" / "Details" fold, so nothing is hidden.
- **Honest wording kept.** "Evidence of agreed terms, not a legal instrument", "Kabla never agrees for you", "SYNTHETIC", "illustrative" and "not legal advice" are unchanged in meaning. No score, readiness, MeTTa or API change.
- **EN and SW stay in step** in `web/src/i18n.ts` (the typed lookup fails the build if Swahili lacks a key). **The Swahili is AI-drafted and needs a fluent reviewer.** It was written to be equally plain, but nobody has checked it.

## 2026-10-21 - Work first: register and clear rights BEFORE any contract (scope confirmed by the student)

**Scope.** The student's aim, in their words: "getting musicians to create NFTs and clear IPs even before any contract is signed, thus we can ensure they are always safe and have clear credit scores before then, then comes in the contract aspect". Asked how far to go, the student chose **"Reorder"** in chat on 2026-10-21: keep the current build, but move "Register your work" and the rights checklist to the front as a **Before** stage. This reorders the product around that stage; it does not change the track, the brief or the stage the repo records (Track 4, Brief B, Licence, plus the Protect-lite Before step).

- **New order.** Before: You (profile, music links and audience numbers) -> Register your work (`/passport`) -> Your work passport (`/passport/issued`, with the Rights check). During: Desk, Clause map, Simulator, Theater, Sign check. After: Licence desk, Financier view, Verify. The routes did not change (`/passport` and `/passport/issued` still work); only their place in the rail (now steps 02 and 03), the landing text, the wizard's last button ("Register your work"), the Karani lines and the links changed. The Desk shows a warning with a button when the work has no passport yet ("Register this work first so your rights are clear before you sign"). It only warns: the folders stay clickable, consistent with "Kabla does not block or decide for you".
- **Register works with no contract.** It already did, in the API: `POST /works` and `POST /passport/{artist}/issue` read only the synthetic work file ("Asali ya Jioni": 60/40 composition split, both co-writers confirmed, 100% total) and the artist's standing red lines. What needed a contract was only the page's ready-check (`GET /contracts/{id}/readiness`). **The one API addition** is `GET /works/{work_id}/check?artist=` (`readiness.work_check`): the owners, composition total, co-writer consents, AI rule, whether the work is already registered, and the same four-item checklist (`readiness.checklist`, unchanged). Added and tested: a register -> issue -> verify run with no contract in the store, and the 404 for an unknown work. The registered work is still the one synthetic work; a real version needs a work form (title, co-writers, shares, consents) and a file upload. The Register page says so.
- **Rights check unchanged.** No scoring weight, MeTTa rule or label changed. It stays "Rights check (not a credit score)". With no contract read, a registered "Asali ya Jioni" already scores 65, as before; the contract-dependent stamp "Read Before Signing" appears later (a test covers both). The passport page now refreshes the score and stamps from the API when opened, so later steps show up there.
- **No NFT, no chain.** The student's wording mentions NFTs. Kabla does **not** mint anything and does not claim to. The work passport is a tamper-evident, signed (Ed25519), hash-linked record kept by the demo server. The API still carries ERC-721-shaped metadata (`profile.json`, the `nft` field of an issued passport), labelled "Not minted anywhere in this build"; the web pages never call it an NFT. Both Register and Your work passport carry one short honest note: "On the roadmap: a work passport you can anchor on a public chain (an NFT-style token), so you own it outside Kabla." What it would need (wallet, testnet, contract tests, legal review) is in `docs/NEXT.md`. The existing `contracts/KablaPassport.sol` is a compile-only sketch.
- **Audience signals (credibility).** The musician types followers (Instagram, TikTok, Facebook), Spotify monthly listeners, YouTube subscribers, an optional average of likes per post and a short note, in the You room and in wizard step 2. They are **self-reported and unverified**, and every place they appear says "Self-reported, not verified". **No scraping**: Instagram, TikTok, Facebook and YouTube forbid it in their terms and it would need the owner's consent and official API access; Kabla never opens these accounts. They sit **beside** the Rights check on the work passport and the Financier view as an "Audience credibility" card (total reach, engagement, a plain band, and how it was worked out), and they **never** enter the Rights check, which still counts only evidence about ownership. The card says it tells nothing about money or whether a loan could be repaid, and it is never called a credit score.
- **How the band is worked out** (`api/kabla/services/audience.py`, plain arithmetic, unit-tested, no language model). Total reach = the sum of the typed numbers. Engagement = average likes per post divided by the followers on Instagram, TikTok, Facebook and YouTube (Spotify listeners are not followers, so they are left out); shown only when both numbers are given, and not shown when likes exceed followers ("check your numbers"). Band: under 1,000 reach is **Just starting**; 1,000 or more is **Growing**; 10,000 or more is **Established**. Engagement can move a band: 500 or more reach with 5% engagement or more counts as Growing, and a large reach (10,000+) with under 1% engagement is held at Growing (a gentle hint, not an accusation). **These thresholds are illustrative examples I chose, not industry or lender rules.** The architecture says MeTTa decides the rights facts; this is a presentation reading of typed numbers, so a small pure function was the proportionate choice in the time. Moving it into a MeTTa file is possible later without changing the API shape.
- **Stored with the existing profile.** `POST /artists` takes an optional `audience` object; the profile keeps the typed numbers and their reading, and the typed numbers (never the reading) are added to the sealed profile certificate when present. Profiles saved earlier have no `audience` and read back as "none"; they seal and verify as before (tested). `GET /artists/{id}/audience` reads it. The page asks for the profile's own id, not the demo artist's.
- **Words and Swahili.** New copy is short, plain and uses "your limit"-style everyday words. EN and SW are in step in `web/src/i18n.ts`, `web/src/plain.ts` conventions and the Karani lines in `HowTo.tsx`. **The new Swahili is AI-drafted and needs a fluent reviewer** (recorded in `AI_DISCLOSURE.md`).
- **Checks.** API tests (`api/tests/test_before_stage.py`), web build, and the browser check `scripts/e2e_browser.mjs` rewritten to the new order with desktop and 390px screenshots.
