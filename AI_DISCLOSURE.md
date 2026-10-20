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

