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
