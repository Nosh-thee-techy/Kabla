#!/usr/bin/env python3
"""Load the Kabla plugin through Omega's own plugin loader, without Docker.

Why this exists: the Omega Docker image (and Omega's LLM/vector libraries) are several GB and do not fit
on every laptop. Omega's plugin loader, skill registry, config and logger are small. This script stages a
copy of Omega's source (cloned from https://github.com/singnet/Omega, Apache-2.0) under PeTTa's repos/ folder,
gives it a plugins.yaml that lists only the Kabla plugin, and runs omega-plugin/demo/kabla_native.metta.

Honest scope of what a success means: Omega's loader loaded the plugin and its skills ran against the Kabla
API. It does NOT mean the full Omega agent (LLM loop, memory, channels) ran.

Usage:  python scripts/omega_native.py <path-to-omega-clone>   (API already running on :8000)
Output is also written to docs/evidence/omega-load.log.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PETTA = ROOT / ".vendor" / "PeTTa"
LOG = ROOT / "docs" / "evidence" / "omega-load.log"
SWIPL = os.environ.get("SWIPL", r"C:\Program Files\swipl\bin\swipl.exe")

def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    src = Path(sys.argv[1]).resolve()
    dest = PETTA / "repos" / "Omega"
    if dest.exists():
        shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(src, dest, ignore=shutil.ignore_patterns(".git", "Autotests", "tests", "docs"))
    # Only the Kabla plugin: the stock list names channel/provider plugins that need heavy libraries.
    (dest / "config" / "plugins.yaml").write_text(
        '- name: kabla_plugin\n  loader: metta\n  location: "{REPO}/plugins/kabla"\n', encoding="utf-8")
    shutil.copytree(ROOT / "omega-plugin", dest / "plugins" / "kabla",
                    ignore=shutil.ignore_patterns("demo", "__pycache__", "README.md"), dirs_exist_ok=True)
    demo = (ROOT / "omega-plugin" / "demo" / "kabla_native.metta").read_text(encoding="utf-8")
    plugin_dir = (dest / "plugins" / "kabla").as_posix()  # forward slashes: PeTTa strings, no escapes
    (PETTA / "kabla_native.metta").write_text(demo.replace("{PLUGIN_DIR}", plugin_dir), encoding="utf-8")

    env = dict(os.environ, KABLA_API_URL="http://127.0.0.1:8000", PYTHONIOENCODING="utf-8")
    cmd = [SWIPL, "--stack_limit=2g", "-q", "-s", str(PETTA / "src" / "main.pl"), "--",
           "kabla_native.metta", "--silent"]
    LOG.parent.mkdir(parents=True, exist_ok=True)
    print("running:", " ".join(cmd))
    proc = subprocess.run(cmd, cwd=PETTA, env=env, capture_output=True, text=True,
                          encoding="utf-8", errors="replace", timeout=300)
    out = proc.stdout + ("\n--- stderr ---\n" + proc.stderr if proc.stderr.strip() else "")
    LOG.write_text(out, encoding="utf-8")
    print(out)
    loaded = "kabla-plugin loaded" in out and "KABLA-DEMO done" in out
    print("RESULT:", "plugin loaded and skills ran" if loaded else "NOT loaded (see log)")
    return 0 if loaded else 1


if __name__ == "__main__":
    sys.exit(main())
