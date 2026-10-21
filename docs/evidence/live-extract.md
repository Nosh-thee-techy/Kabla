# Live reader check (model reads raw text, compared with the reviewed fixtures)

Run 2026-10-21 10:10:22. Model: `nvidia/nemotron-3-super-120b-a12b` via provider `openai`. SYNTHETIC contracts only. A match means the same clause type and attributes as the human-reviewed fixture; the model's quotes are not compared. This reads clause FACTS only: flags, scores and verdicts still come from MeTTa.

| Contract | Status | Matched | In fixture | Missed | Extra | Dropped (invalid vocabulary) | Seconds |
|---|---|---|---|---|---|---|---|
| c001 | ok | 10 | 11 | 1 | 0 | 1 | 48 |
| c002 | ok | 8 | 10 | 2 | 1 | 1 | 14 |
| c003 | ok | 6 | 9 | 3 | 2 | 1 | 31 |

Overall: 24 of 30 fixture clauses reproduced.
