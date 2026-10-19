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
