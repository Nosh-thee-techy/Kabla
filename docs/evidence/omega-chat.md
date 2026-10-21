# Omega agent chat check

Run 2026-10-21 09:13:01 through `POST /omega/chat`. LLM mode: **live** (`offline-router` = keyword router, not an LLM). Synthetic data only.

| Message | Result | Seconds | Reply (first 300 chars) |
|---|---|---|---|
| never allow AI training on my work | PASS | 6 | The AI training clause for Zawadi has been saved as never, and this setting is remembered across all contracts. |
| analyse c001 | PASS | 9 | The contract c001 has 8 flags, with 4 red and 4 amber. It remembers two red lines: clause 7 under rule R-AI-01, set on October 21, 2026, and clause 5 under rule R-TERM-01, set on October 19, 2026. These red lines are part of the contract's tracked conditions. No further details are provided. |
| why was c001 flagged | PASS | 12 | R-GRANT-01 (clause 4): Clause 4 hands over the master recording rights for ever, in every country, exclusively.  \nR-AI-01 (clause 7): Clause 7 lets the label train AI on your recordings and voice without asking you or paying you. You told Kabla on 2026-10-21: never AI training. Clause 7 breaks this |
| is a 12-month ad in Kenya cleared | PASS | 9 | The license is cleared with conditions: every owner has a verified consent covering Kenya. (R-LIC-OK) |
| hello | PASS | 6 | Hello! I can analyse synthetic contracts, explain flags, set AI-training red lines, or check licence uses. How can I assist you today? |
