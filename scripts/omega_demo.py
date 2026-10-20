#!/usr/bin/env python3
"""Load the Kabla plugin into the real Omega image and call its skills.

Why this exists: README may say "Omega plugin loaded" only if it actually loaded. This script is the
reproducible proof. It starts the published Omega Docker image (no LLM key, no embedding model),
mounts omega-plugin/ at /PeTTa/repos/Omega/plugins/kabla, appends the plugin to Omega's own
config/plugins.yaml, and runs omega-plugin/demo/kabla_demo.metta, which uses Omega's loader
(initPlugins) and then calls the skills against a running Kabla API.

Usage (API already running on :8000):  python scripts/omega_demo.py
Output is also written to docs/evidence/omega-load.log.
"""
from __future__ import annotations

import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "omega-plugin"
LOG = ROOT / "docs" / "evidence" / "omega-load.log"
IMAGE = "singularitynet/omega"
# Appended inside the container only; the Omega image's own file is not modified on disk elsewhere.
YAML_ENTRY = "\\n- name: kabla_plugin\\n  loader: metta\\n  location: \\\"{REPO}/plugins/kabla\\\"\\n"
INNER = (
    "set -e; cd /PeTTa/repos/Omega; "
    f"printf '{YAML_ENTRY}' >> config/plugins.yaml; "
    "cp /demo/kabla_demo.metta /PeTTa/kabla_demo.metta; cd /PeTTa; "
    "sh run.sh kabla_demo.metta"
)


def api_up() -> bool:
    try:
        with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=5) as r:
            return r.status == 200
    except OSError:
        return False


def main() -> int:
    if not api_up():
        print("Kabla API is not answering on http://127.0.0.1:8000. Start it first.")
        return 2
    cmd = [
        "docker", "run", "--rm", "--entrypoint", "bash",
        "--add-host", "host.docker.internal:host-gateway",
        "-e", "KABLA_API_URL=http://host.docker.internal:8000",
        "-v", f"{PLUGIN}:/PeTTa/repos/Omega/plugins/kabla:ro",
        "-v", f"{PLUGIN / 'demo'}:/demo:ro",
        IMAGE, "-lc", INNER,
    ]
    LOG.parent.mkdir(parents=True, exist_ok=True)
    print("running:", " ".join(cmd))
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = proc.stdout + ("\n--- stderr ---\n" + proc.stderr if proc.stderr else "")
    LOG.write_text(out, encoding="utf-8")
    print(out)
    loaded = "kabla-plugin loaded" in out and "KABLA-DEMO done" in out
    print("RESULT:", "plugin loaded and skills ran" if loaded else "NOT loaded (see log)")
    return 0 if loaded else 1


if __name__ == "__main__":
    sys.exit(main())
