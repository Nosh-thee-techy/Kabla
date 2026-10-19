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

Omega (`omega-plugin/`) is a P1 wrapper around the same API. It is not loaded
in the default run.
