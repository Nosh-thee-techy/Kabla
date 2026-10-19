# Kabla Omega plugin (P1)

This plugin registers four Omega skills that call the **same FastAPI** the
web app uses. MeTTa still decides; the skills only ferry facts and trails.

**Status (2026-10-19): plugin files are written; the plugin has not been loaded
in a live Omega agent in this repo.** README must not say "built on Omega"
until `loadOmegaPlugin` actually runs. Fallback ladder: **L0** (MeTTa on PeTTa
+ FastAPI + UI) is the shipping product. L1 is next.

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

Python helper `kabla_plugin.py` talks to `KABLA_API_URL` (default
`http://127.0.0.1:8000`).
