# Kabla Omega plugin (P1)

This plugin registers four Omega skills that call the **same FastAPI** the
web app uses. MeTTa still decides; the skills only ferry facts and trails.

**Status (2026-10-20, partial L1):** `python scripts/omega_native.py <path-to-omega-clone>`
loads Omega's own config, logger, plugin-listing and skill-registry modules on
PeTTa, imports this plugin, runs its `loadOmegaPlugin` (four skills land in
Omega's registry) and calls the skills against the API: set a red line, analyse
`c001`, analyse `c002` with the red line carried. Log: `docs/evidence/omega-load.log`.

What this is **not**: the Omega agent loop (LLM, memory, chat channels) did not
run, the full Docker image could not be pulled on this machine (disk), and
Omega's own `loadMettaPlugin` did not finish on Windows, so its three steps are
done by hand in `demo/kabla_native.metta`. Do not say "built on Omega".
`demo/kabla_demo.metta` + `scripts/omega_demo.py` are the Docker version, untested.
The helper is `kabla_skills.py` (not `kabla_plugin.py`: same basename as the
`.metta` confuses the loader). Fallback ladder: **L0** (MeTTa on PeTTa +
FastAPI + UI) is the shipping product.

## Skills

| Skill | What it does |
|---|---|
| `kabla-analyze` | `POST /contracts/{id}/analyze` |
| `kabla-licence` | `POST /licence/check` |
| `kabla-redline-set` | `POST /redlines` (Red Lines memory) |
| `kabla-explain` | grounds "why?" in the stored trail |

## Load (when Omega is installed)

1. Copy or mount this folder into an Omega checkout.
2. Add to `config/plugins.yaml`:

```yaml
- name: kabla_plugin
  loader: metta
  location: "{REPO}/../kabla/omega-plugin"
```

3. Run Omega with `provider=mockprovider commchannel=mockchannel` to confirm
   `loadOmegaPlugin` logs "kabla-plugin loaded" without an LLM key.

Python helper `kabla_skills.py` talks to `KABLA_API_URL` (default
`http://127.0.0.1:8000`).
