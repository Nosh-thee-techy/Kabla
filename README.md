# Kabla

**Know what you're signing. Prove what you own.**

Kabla ("before") reads a music or art contract *before* the artist signs it,
shows every trap with the clause behind it, negotiates a fairer version with
the label's agent in front of the artist, and, once terms are agreed, issues a
tamper-evident Rights Passport.

> **Hackathon:** BASIX State of the Art Hackathon 2026
> **Track:** 4 — BASIX.MARKET Builds · **Brief B:** Managing originals (Art IP and Music IP)
> **Stage built:** **License**
> **Team:** solo (record institution or Independent on the BASIX profile)
> **Engine:** **MeTTa on PeTTa.** Omega plugin files exist; they have **not** been loaded in a live Omega agent. Do not describe this as "built on Omega".

All contracts, artists, labels, works and amounts are **SYNTHETIC**.

## One-command run

```bash
python scripts/tasks.py setup   # PeTTa, Python venv, npm, demo keys
python scripts/tasks.py run     # API :8000  +  web :5173
```

Linux/macOS: `make setup && make run`. Requires SWI-Prolog ≥ 9.3 and Node 22.

Docker (API + web; no Omega): `docker compose up --build`. Web is on http://localhost:5173 and proxies `/api` to the API.

- API health: http://localhost:8000/health
- Desk: http://localhost:5173

`KABLA_MODE=deterministic` (default) uses fixtures and templates — no LLM, no network.

## Problem

Contracts are hard to read. Rights terms matter. An explanation the artist can
challenge is better than a verdict she must trust. Kabla is not a lawyer.

## Solution

Paste a contract (or pick a sample). MeTTa rules flag traps, simulate earnings
(illustrative), negotiate in the open, then seal a Rights Passport.

## How it works

Contract text → clause facts (fixture or LLM) → MeTTa on PeTTa → flags,
licence verdicts, score, negotiation moves → UI with EN/SW trails.

The API writes `facts.metta`, runs PeTTa, parses `(result …)` lines. Boring on
purpose.

## Technology

- MeTTa rules on [PeTTa](https://github.com/trueagi-io/PeTTa) / SWI-Prolog
- FastAPI + SQLite
- React + Vite + Tailwind
- Ed25519 (PyNaCl) hash-linked ledger
- Omega plugin **next** (see `omega-plugin/README.md`)

## How to test

```bash
python scripts/tasks.py test          # MeTTa + pytest + web build
python scripts/e2e_demo.py            # three demo scenes → docs/transcripts/
```

## Demo video

≤ 3:00, captioned. Script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). Link goes here when recorded.

## Team

Record names on BASIX.MARKET. Do not claim a prize or co-ownership for the team.

## Docs

[Limitations](LIMITATIONS.md) · [AI disclosure](AI_DISCLOSURE.md) · [Rules](docs/RULES.md) · [Architecture](docs/ARCHITECTURE.md) · [What's next](docs/NEXT.md)

## Credits

PeTTa (MIT), Omega (Apache-2.0), BASIX starter. See NOTICE.
