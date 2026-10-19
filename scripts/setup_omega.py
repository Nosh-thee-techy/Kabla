#!/usr/bin/env python3
"""Honest Omega status. Does not clone or load Omega.

P0 ships MeTTa on PeTTa. Plugin files live in omega-plugin/ and have not been
loaded in a live Omega agent in this repo. Cloning Omega (janus-swi, torch,
chromadb) is out of the License-stage default path.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "omega-plugin" / "kabla_plugin.metta"


def main() -> int:
    if not PLUGIN.exists():
        print("omega-plugin/kabla_plugin.metta missing")
        return 1
    text = PLUGIN.read_text(encoding="utf-8")
    if "(= (loadOmegaPlugin)" not in text:
        print("plugin does not define loadOmegaPlugin")
        return 1
    print("Omega status: plugin files present; not loaded in a live Omega agent.")
    print("Shipping engine: MeTTa on PeTTa (L0). See omega-plugin/README.md.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
