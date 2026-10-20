# Overnight work queue (agent loop)

Deadline: **Wed 21 Oct 23:59 EAT** (moved from tonight). The agent works down this list,
ticks items off, commits small, and never commits while tests or the web build are red.
Each tick: read this file, take the first unchecked item, do it, update it.

Standing rules: synthetic data only; no secrets in git (keys live in `.env`, never read or printed);
never claim "built on Omega" beyond what `docs/evidence/` shows; keep `AI_DISCLOSURE.md` and
`docs/DECISIONS.md` updated; user submits on BASIX.MARKET, not the agent.

Watchdogs: every network or LLM call has a timeout and a clear fallback; long jobs run in the
background and are polled; if one item is stuck for ~45 min, write the blocker here and move on.

## Queue

- [ ] A1. Omega runtime deps installed natively on Windows into `.vendor/omega-site` (CPU torch, chromadb, sentence-transformers; pip log `.vendor/pip-omega.log`), used through PYTHONPATH. WSL and Docker were tried and ruled out: WSL has no outbound network, the image pull never finished. Landlock is Linux-only, so `securityPolicyPath` is set empty (Omega documents that as "restrictions off") and the docs say so.
- [ ] A2. Run the Omega agent loop with the mock provider and a mock chat channel, Kabla plugin listed in its plugins.yaml; fix the loader step that failed on Windows.
- [ ] A3. Omega answers through the plugin skills (red line set, analyse, explain) with memory on; log to `docs/evidence/omega-agent.log`; `scripts/omega_run.py` runs it with timeouts.
- [ ] A4. LLM key path: when `OPENAI_API_KEY` or equivalent is in `.env`, Omega uses the real provider; without it, the mock provider and a clear message.
- [ ] B1. Before: `/onboard` (name, handles, consent tick, pasted bio), API `POST/GET /artists`, labelled synthetic fixtures, no scraping.
- [ ] B2. Before: MeTTa rule file that lists profile gaps (no change to existing rules/weights); the profile sets the current artist everywhere.
- [ ] B3. Rail grouped Before / During / After; Karani cue + CTA for onboarding; EN/SW strings.
- [ ] B4. Seal the profile in the existing hash-linked ledger; ERC-721-shaped metadata; wording "self-declared, consent-recorded".
- [ ] C1. Browser click-through of every room (Playwright), per-room pass/fail table in `docs/E2E.md`.
- [ ] C2. Testnet contract source + local-chain test only (no deploy without a funded key from the user).
- [ ] D1. README, DECISIONS, AI_DISCLOSURE, NEXT, record checklist, `SUBMISSION.md` agent status report.

When all tasks are completed, push to main and do no further checks.
## Log

(agent appends one line per finished item or blocker, newest last)
- 23:40 A1 started: WSL has no outbound network; native Windows install running in background.
