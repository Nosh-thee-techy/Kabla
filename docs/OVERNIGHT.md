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

- [x] A1. Omega runtime deps installed natively on Windows into `.vendor/omega-site` (CPU torch, chromadb, sentence-transformers). WSL and Docker were tried and ruled out. Landlock is Linux-only, so `securityPolicyPath` is empty and the docs say so.
- [x] A2. Real Omega agent loop runs (`scripts/omega_run.py`): Kabla provider + Kabla chat channel + Kabla plugin, PeTTa v1.0.4.
- [x] A3. Omega answers through the plugin skills with memory on; evidence in `docs/evidence/omega-chat.md` (5 of 5 turns, offline-router mode) and `docs/evidence/omega-agent-excerpt.log`.
- [x] A4. LLM key path written: live model when `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` is in `.env`, else a labelled offline router. Timeout, retry, circuit breaker, fallback. Live request code **not yet tried against a real endpoint**.
- [x] B1. Before: `/onboard`, `POST/GET /artists`, consent tick, no scraping.
- [x] B2. Before: `engine/profile.metta` lists profile gaps (no change to existing rules/weights).
- [x] B3. Rail grouped Before / During / After; Karani steps and EN/SW strings; Desk profile strip; "Ask the Omega agent" panel.
- [x] B4. Profile sealed in its own signed hash chain; ERC-721-shaped metadata (not minted); wording "self-declared, consent-recorded".
- [x] C1. Browser click-through of every room (Playwright), per-room table in `docs/E2E.md`.
- [x] C2. (reduced) Testnet contract **source** `contracts/KablaPassport.sol` + compile check (`scripts/compile_contract.mjs`). No on-chain test, no deploy (needs a key the user funds).
- [x] D1. README, DECISIONS, AI_DISCLOSURE, NEXT, `SUBMISSION.md` agent status report.

Not pushed: the user decides when to push and submits on BASIX.MARKET themselves.

## Log

(agent appends one line per finished item or blocker, newest last)
- 23:40 A1 started: WSL has no outbound network; native Windows install running in background.
- 23:57 B1-B4 done and committed (56 API tests, web build green). A4 written and committed with chat bridge API (`/omega/chat`), `scripts/omega_run.py` (watchdog restarts a silent agent). First pip attempt stalled on scipy for 30 min; restarted with retries.
- A1-A3 done: agent loop running, 5/5 chat turns through the plugin skills.
- C1 done: 12/12 rooms pass in the browser.
- D1 done. Clean clone of d9640f6: `tasks.py setup` then `tasks.py test` passed (76 MeTTa checks, 59 API tests, web build). The wrapper script died between the two steps, so they were run separately.
- C2 reduced to a compile-checked contract sketch.
