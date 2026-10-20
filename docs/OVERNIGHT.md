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

- [ ] A1. Omega runtime deps installed natively on Windows into `.vendor/omega-site` (CPU torch, chromadb, sentence-transformers; pip log `.vendor/pip-omega2.log`), used through PYTHONPATH. WSL and Docker were tried and ruled out. Landlock is Linux-only, so `securityPolicyPath` is empty and the docs say so. The slow link stalled the first attempt; it was restarted with retries.
- [ ] A2. Run the real Omega agent loop (`scripts/omega_run.py`): Kabla provider + Kabla chat channel + Kabla plugin; fix whatever fails to load on Windows.
- [ ] A3. Omega answers through the plugin skills (red line set, analyse, explain) with memory on; evidence in `docs/evidence/omega-agent.log`.
- [x] A4. LLM key path written: `omega-plugin/kabla_llm.py` uses a live model when `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is in `.env`, else an offline keyword router (labelled "not an LLM"). Timeout, retry, circuit breaker, fallback. Offline router unit-checked.
- [x] B1. Before: `/onboard`, `POST/GET /artists`, consent tick, no scraping.
- [x] B2. Before: `engine/profile.metta` lists profile gaps (no change to existing rules/weights).
- [x] B3. Rail grouped Before / During / After; Karani steps and EN/SW strings; Desk profile strip; "Ask the Omega agent" panel.
- [x] B4. Profile sealed in its own signed hash chain; ERC-721-shaped metadata (not minted); wording "self-declared, consent-recorded".
- [ ] C1. Browser click-through of every room (Playwright), per-room pass/fail table in `docs/E2E.md`.
- [ ] C2. Testnet contract source + local-chain test only (no deploy without a funded key from the user).
- [ ] D1. README, DECISIONS, AI_DISCLOSURE, NEXT, record checklist, `SUBMISSION.md` agent status report.

When all tasks are completed, push to main and do no further checks.

## Log

(agent appends one line per finished item or blocker, newest last)
- 23:40 A1 started: WSL has no outbound network; native Windows install running in background.
- 00:00 B1-B4 done and committed (56 API tests, web build green). A4 written and committed with chat bridge API (`/omega/chat`), `scripts/omega_run.py` (watchdog restarts a silent agent). First pip attempt stalled on scipy for 30 min; restarted with retries.
