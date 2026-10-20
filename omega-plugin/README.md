# Kabla Omega plugin

Four Omega skills that call the **same FastAPI** the web app uses, plus an LLM provider and a chat channel so the
real Omega agent loop can run with them. MeTTa (inside the API) still decides; the skills only ferry facts and trails.

**Status (2026-10-21):** `python scripts/omega_run.py` runs Omega's real agent loop natively on Windows (PeTTa v1.0.4,
Omega `main`) with this plugin, Omega's memory, and the files below. `python scripts/omega_smoke.py` sends five chat
messages through the API and records the answers in `docs/evidence/omega-chat.md`. The log excerpt is
`docs/evidence/omega-agent-excerpt.log`.

What this is **not**: no LLM was used in that run (no key was set): the provider answered with a labelled keyword router.
There is no Landlock sandbox on Windows. The web product does not depend on Omega. Do not say "built on Omega". The
patches made to the staged Omega copy are listed in `docs/DECISIONS.md`.

## Files

| File | Role |
|---|---|
| `kabla_plugin.metta` | MeTTa plugin: registers the four skills (`loadOmegaPlugin`) |
| `kabla_skills.py` | HTTP helpers behind the skills; each result starts with a one-line `DIGEST:` |
| `kabla_llm.py` | Provider `Kabla`: live model if `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` is set, otherwise (or on timeout, error, open circuit) an offline keyword router. Never logs a key |
| `kabla_chat.py` | Channel `kabla`: `var/omega/inbox.json` in, `var/omega/outbox.jsonl` out; the API bridges it at `/omega/chat` |
| `demo/kabla_agent.metta` | Omega's `lib_omega` imports as direct paths, then `(omega)` |
| `demo/kabla_native.metta` | Earlier skill-registry-only harness (`scripts/omega_native.py`) |

## Skills

| Skill | What it does |
|---|---|
| `kabla-analyze` | `POST /contracts/{id}/analyze` |
| `kabla-licence` | `POST /licence/check` |
| `kabla-redline-set` | `POST /redlines` (Red Lines memory) |
| `kabla-explain` | grounds "why?" in the stored trail |

## Run

```
python scripts/tasks.py run        # API :8000 + web :5173
python scripts/omega_run.py        # the agent, with a watchdog (needs Omega's Python deps in .vendor/omega-site)
python scripts/omega_smoke.py      # five chat turns, writes docs/evidence/omega-chat.md
```

For a stock Omega (Linux/Docker) instead: mount this folder, then in `config/plugins.yaml` add `kabla_plugin` (loader `metta`),
`kabla_llm` and `kabla_chat` (loader `python`), each with this folder as `location`, and set `provider: Kabla`, `commchannel: kabla`.
Python helpers read `KABLA_API_URL` (default `http://127.0.0.1:8000`) and `KABLA_OMEGA_DIR`.

The helper is `kabla_skills.py` (not `kabla_plugin.py`: the same basename as the `.metta` confuses the loader).
Fallback ladder: **L0** (MeTTa on PeTTa + FastAPI + UI) is the shipping product.
