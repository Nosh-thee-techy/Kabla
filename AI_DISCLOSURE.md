# AI disclosure

Every use of AI in this project is logged here, append-only. Entries are never removed.

## Policy inside the product

- **MeTTa decides; the LLM only reads and phrases.** Every flag, verdict, score point and
  negotiation move comes from a MeTTa rule with a rule id and a clause trail.
- In `KABLA_MODE=live` an LLM may (a) extract clause facts from contract text into JSON and
  (b) polish wording. In `KABLA_MODE=deterministic` (the default and the demo mode) no LLM
  and no network are used: extractions come from reviewed fixtures in `data/extractions/`
  and all explanations come from fixed EN/SW templates.

## Log

| Date | Tool | What it did | Human review |
|---|---|---|---|
| 2026-10-19 | Cursor agent (Claude) | Repo scaffolding: LICENSE/NOTICE, docs skeletons, decisions log | Reviewed by team |
| 2026-10-19 | Cursor agent (Claude) | Wrote the three SYNTHETIC contracts, extraction fixtures, artist/work/policy data | Reviewed by team |
| 2026-10-19 | Cursor agent (Claude) | Wrote MeTTa rule modules (flags, red lines, licence, simulator) and their tests, verified on PeTTa | Reviewed by team; tests run on every commit |
| 2026-10-19 | Cursor agent (Claude) | Drafted the English and **Swahili** explanation templates (`api/kabla/i18n/`) and the RULES.md generator | Swahili is AI-drafted and **must be checked by a fluent speaker** (see LIMITATIONS.md) |
| 2026-10-19 | Cursor agent (Claude) | FastAPI routers/services (analyze, licence, negotiate, passport, chat) and pytest suite | Reviewed by team; tests run before commits |
| 2026-10-19 | Cursor agent (Claude) | Vite/React UI (Desk, Clause Map, Simulator, Theater, Licence Desk, Passport, Verify) | Reviewed by team; `npm run build` green |
| 2026-10-19 | Cursor agent (Claude) | Omega plugin files (`loadOmegaPlugin` skills). **Not loaded in a live Omega agent.** | Honest L0 status recorded in README |
| 2026-10-19 | Cursor agent (Claude) | e2e demo script, Dockerfiles, DEMO_SCRIPT, ARCHITECTURE, NEXT | Reviewed by team |
| 2026-10-19 | Cursor agent (Grok 4.6) | Forked continuation: web build, Docker, chat/omega tests, remaining docs | Reviewed by team |
| 2026-10-19 | Cursor agent (Grok 4.6) | Fixed passport `never` vs licence vocabulary; setuptools README path; clean-clone gate | Reviewed by team; `verify_clean_clone` green |
| 2026-10-19 | Cursor agent (Grok 4.6) | Production Dockerfile + FastAPI SPA/`/api` prefix so the demo can be hosted (Railway) | Reviewed by team |
| 2026-10-19 | Cursor agent (Grok 4.6) | Expanded README: product story, seven-screen desk, MeTTa decision path, and a detailed Kabla-vs-Claude (LLM chatbot) section | Reviewed by team |
| 2026-10-19 | Cursor agent (Grok 4.6) | Night Desk UI: design tokens, journey rail, redesigned seven rooms, empty states, favicon/OG | Reviewed by team |
| 2026-10-19 | Cursor agent (Grok 4.6) | Full-bleed rooms, clearer dark mode, and per-page how-to guidelines (EN/SW) | Reviewed by team |
| 2026-10-19 | Cursor agent (Grok 4.6) | Moved how-tos into a small guide card at the bottom of each room | Reviewed by team |
| 2026-10-20 | Cursor agent (Grok 4.6) | Pre-sign surfaces: sign-readiness preview (same `score.metta` on hypothetical events), checklist gate (warnings only), deal-fairness meter (flag summary with clause trail) | Reviewed by team; pytest + web build |
| 2026-10-20 | Cursor agent (Grok 4.6) | Readiness review: best-case label before theater, standing facts marked already-true, live dates, two fair topics | Reviewed by team |
| 2026-10-20 | Cursor agent (Grok 4.6) | README: honest chatbot comparison (no product names), why deterministic, moat-not-yet | Reviewed by team |
| 2026-10-20 | Cursor agent (Grok 4.6) | Judge-facing README top; Financier view (existing facts only); red-line date sticker on clause map | Reviewed by team; pytest + web build |
| 2026-10-20 | Cursor agent (Grok 4.6) | Clause map: fold flag list and score cards into a slim strip so the contract is readable | Reviewed by team |
| 2026-10-20 | Cursor agent (Grok 4.6) | Design pass: tighter gutters, one-row header with numbered rail, ruled-paper rooms, hairline panels and ledger lists on every page; no logic changes | Reviewed by team; web build; headless screenshots |
| 2026-10-20 | Cursor agent (Grok 4.6) | Karani desk-clerk avatar (SVG) with state-aware one-line guidance at the top of every room; theater flow strip and decided-counter; EN/SW copy drafted by the agent, Swahili needs a fluent check | Reviewed by team; web build |
| 2026-10-20 | Cursor agent (Grok 4.6) | Karani as a bottom-right card that pauses the room, with a CTA per state; `/voice` endpoint proxying ElevenLabs text-to-speech (key server-side, disk cache, browser-speech fallback); CTA copy EN/SW | Reviewed by team; pytest (47) + web build + headless screenshots |
| 2026-10-20 | ElevenLabs text-to-speech (runtime, optional) | Reads Karani's guidance lines aloud when a key is configured. Does not read contracts or make any decision | Team enables via `.env` |
| 2026-10-20 | Cursor agent (Claude) | Pasted-contract handling: plain 422 messages instead of a crash (deterministic mode and live mode without a key), 2 tests; Passport/Verify/Financier use the open contract's artist; Financier added to the journey rail | Reviewed by team; pytest + web build |
| 2026-10-20 | Cursor agent (Claude) | Omega harness: plugin loader file, demo MeTTa script and scripts/omega_demo.py written. **Not yet shown to load**; see DECISIONS for status | Status recorded honestly in README |

| 2026-10-20 | Cursor agent (Claude) | Omega partial L1: renamed helper to kabla_skills.py, native harness (scripts/omega_native.py, omega-plugin/demo/kabla_native.metta) that runs Omega's skill registry with our plugin and the Red Lines demo; log in docs/evidence/omega-load.log. Not the full agent loop | Reviewed by team; log is real output |

| 2026-10-21 | Cursor agent (Claude) | Before stage: onboarding page, MeTTa gap rules (engine/profile.metta), sealed profile chain, Before/During/After rail, EN/SW copy (Swahili AI-drafted, needs fluent review) | Reviewed by team; pytest + web build + browser click-through |
| 2026-10-21 | Cursor agent (Claude) | Omega agent running natively: Kabla LLM provider (offline router + live model path with timeout/circuit breaker), file chat channel, runner with watchdog, chat bridge API, Desk chat panel. **No LLM was used in the agent run**; the live-model code is untested against a real key | Evidence in docs/evidence/omega-*; tests in omega-plugin/tests |
| 2026-10-21 | Cursor agent (Claude) | Playwright browser click-through (scripts/e2e_browser.mjs, docs/E2E.md) | Per-room pass/fail table; screenshots in docs/evidence/e2e |
| 2026-10-21 | Cursor agent (Claude) | Solidity sketch of a non-transferable passport token (contracts/KablaPassport.sol) and a solc compile check (scripts/compile_contract.mjs) | Compile-only; not tested on a chain, not audited, not deployed; needs human review before any testnet use |
| 2026-10-21 | NVIDIA Nemotron 3 Super (via OpenRouter) at product run time | Phrases the one-line results of Kabla's skills in the Omega agent chat and answers small talk; never picks the skill and never judges a clause. Replies are vetted (rule ids kept, no new numbers, no leaked reasoning) or replaced by the raw result. Only SYNTHETIC data is sent | Smoke-tested 5 of 5 turns (docs/evidence/omega-chat.md); key in git-ignored .env, to be rotated |
| 2026-10-21 | Cursor agent (Claude) | Rewrote the Omega LLM provider to router + phrasing + vetting + idle throttle, fixed the smoke check, tests (12 plugin tests), docs | Reviewed by team; tests green |
| 2026-10-21 | Cursor agent (Claude) | Persisted web state across reloads, OpenAI-compatible URL for the live extractor, live-extraction check against the reviewed fixtures, .env loading fix, browser row for reload | Reviewed by team; 61 API tests, web build, 13/13 browser rows |
| 2026-10-21 | NVIDIA Nemotron 3 Super (via OpenRouter) at product run time | In KABLA_MODE=live, reads pasted contract text into clause facts (vocabulary-checked; never flags or judges). Experimental: 24 of 30 fixture clauses reproduced. Only SYNTHETIC text sent | docs/evidence/live-extract.md; needs the confirm-this-clause step before real use |
| 2026-10-21 | Cursor agent (Claude) | Deployed the demo to Fly.io (fly.toml, volume, Dockerfile), wrote the web+API entry point (api/kabla/web.py) and its tests | Browser check against the live URL 13/13; no keys on the host |
| 2026-10-21 | Cursor agent (Claude) | Theater redesign: curtain and two-clerk stage, tug-of-war bars, stamped contract cards, readiness count-up with +/- chip and per-round trail, curtain-down ending scene (EN/SW copy drafted by the agent, Swahili needs a fluent check); mobile header overflow fix; browser check saves Theater screenshots | Reviewed by team; web build; 13/13 browser rows; screenshots viewed at three states, mobile, Swahili and reduced-motion |
| 2026-10-21 | Cursor agent (Claude) | Theater: one-card-at-a-time focus (blur the waiting cards, answered cards slide down), plainer EN copy, small SW additions (AI-drafted, unchecked) | Reviewed by team; web build and browser check |
| 2026-10-21 | Cursor agent (Claude) | Sign check room (/check): moved the readiness block out of the Theater into its own ordered page (headline numbers, what is holding it back, already in good shape, checklist, round-by-round chart), compact card in the Theater, rail/guide/EN+SW copy (Swahili AI-drafted, unchecked) | Reviewed by team; web type-check; browser row with desktop and 390px screenshots viewed |
| 2026-10-21 | Cursor agent (Claude) | Passport split into two rooms: Register (/passport: ready-check, what registering does, consent, sale tick, button) and Your passport (/passport/issued: card, stamps, score, why, next steps, empty state); rail step, EN/SW copy (Swahili AI-drafted, unchecked), browser rows 07/07b and a screenshot script | Reviewed by team; web type-check for these files; browser rows 07 and 07b pass; desktop and 390px screenshots viewed |
| 2026-10-21 | Cursor agent (Claude) | Landing page (/), local demo sign-in (/signin, no password, no account, browser-tab storage only), three-step set-up wizard (/welcome) over the existing profile call, sign out / start fresh, Desk moved to /desk, EN/SW copy (Swahili AI-drafted, unchecked), browser rows 00-01b, 11, 12 | Web build for these files; browser check 18/18 on a fresh store; desktop and 390px screenshots viewed. **Not a real login; no real accounts exist** |
| 2026-10-21 | Cursor agent (Claude) | Plain-language pass over all card text (EN and SW) and a front-end mapping of API-only text (web/src/plain.ts) with the exact rule behind a fold | Reviewed by team; web build and browser check. **Swahili is AI-drafted and needs a fluent reviewer** |
