# Architecture

```
web (Vite + React)  --REST-->  FastAPI  --subprocess-->  PeTTa (MeTTa)
                                      \-- SQLite store, Ed25519 keys
```

Per request the bridge writes `facts.metta`, runs
`swipl -q -s PeTTa/src/main.pl -- engine/main.metta [policy] facts.metta query.metta --silent`,
and parses lines starting with `(result `.

Deterministic mode never calls an LLM. Live mode may extract clauses; it never
decides flags, verdicts, scores or negotiation moves.

Omega (`omega-plugin/`) is a wrapper around the same API. It is not part of the default run.
`scripts/omega_run.py` runs Omega's real agent loop with Kabla's skills, provider and chat channel: a router picks the
skill, a live model (if a key is set) only phrases the result, and an offline router answers otherwise. The web
product never depends on it. See `omega-plugin/README.md`.
