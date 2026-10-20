# Omega agent chat check

Run 2026-10-21 01:07:40 through `POST /omega/chat`. LLM mode: **offline-router** (`offline-router` = keyword router, not an LLM). Synthetic data only.

| Message | Result | Seconds | Reply (first 300 chars) |
|---|---|---|---|
| never allow AI training on my work | PASS | 6 | [offline router, not an LLM] red line saved for zawadi: ai-training never (remembered across contracts) |
| analyse c001 | PASS | 6 | [offline router, not an LLM] c001: 8 flags ({ red : 4, amber : 4}) / remembered red lines: clause 7 R-AI-01 (red line set 2026-10-20); clause 5 R-TERM-01 (red line set 2026-10-19) |
| why was c001 flagged | PASS | 6 | [offline router, not an LLM] R-GRANT-01 (clause 4): Clause 4 hands over the master recording rights for ever, in every country, exclusively. Clause 4 hands over the master recording rights for ever, in every country, exclusively. R-AI-01 (clause 7): Clause 7 lets the label train AI on your recording |
| is a 12-month ad in Kenya cleared | PASS | 6 | [offline router, not an LLM] cleared (R-LIC-OK): Cleared with conditions: every owner has a verified consent covering Kenya. |
| hello | PASS | 3 | [offline router, not an LLM] I can: analyse a synthetic contract (say 'analyse c001'), explain a flag ('why was c001 flagged'), set an AI-training red line, or check a licence use ('is a 12-month ad in Kenya cleared'). All data here is synthetic. A real LLM will phrase answers more naturally once a  |
