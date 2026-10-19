#!/usr/bin/env python3
"""Fetch PeTTa at a pinned commit into .vendor/PeTTa and smoke-test it.

Cross-platform twin of scripts/setup_petta.sh (stdlib only).
Requires git and SWI-Prolog >= 9.3 (10.0.2 tested).
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

PETTA_REPO = "https://github.com/trueagi-io/PeTTa"
PETTA_COMMIT = "fea83178af3722666d2948d074591d10a3134f56"  # 2026-10-15

ROOT = Path(__file__).resolve().parent.parent
DEST = Path(os.environ.get("PETTA_HOME", ROOT / ".vendor" / "PeTTa"))
if not DEST.is_absolute():
    DEST = ROOT / DEST


def find_swipl() -> str:
    candidates = [os.environ.get("SWIPL"), shutil.which("swipl"),
                  r"C:\Program Files\swipl\bin\swipl.exe", "/usr/bin/swipl",
                  "/usr/local/bin/swipl", "/opt/homebrew/bin/swipl"]
    for c in candidates:
        if c and (shutil.which(c) or Path(c).exists()):
            return c
    sys.exit("SWI-Prolog not found. Install it (https://www.swi-prolog.org) or set SWIPL=/path/to/swipl")


def git(*args: str) -> None:
    subprocess.run(["git", *args], cwd=DEST, check=True)


def main() -> None:
    if not (DEST / "src" / "main.pl").exists():
        DEST.mkdir(parents=True, exist_ok=True)
        git("init", "-q")
        git("remote", "add", "origin", PETTA_REPO)
    head = subprocess.run(["git", "rev-parse", "HEAD"], cwd=DEST, capture_output=True, text=True).stdout.strip()
    if head != PETTA_COMMIT:
        print(f"fetching PeTTa {PETTA_COMMIT[:7]} -> {DEST}")
        git("fetch", "-q", "--depth", "1", "origin", PETTA_COMMIT)
        git("checkout", "-q", "--detach", PETTA_COMMIT)

    swipl = find_swipl()
    hello = ROOT / "engine" / "hello.metta"
    out = subprocess.run([swipl, "-q", "-s", str(DEST / "src" / "main.pl"), "--", str(hello), "--silent"],
                         capture_output=True, text=True, encoding="utf-8")
    if "(hello kabla 42)" not in out.stdout:
        print(out.stdout, out.stderr)
        sys.exit("PeTTa smoke test failed")
    print(f"PeTTa OK ({PETTA_COMMIT[:7]}) with {swipl}")


if __name__ == "__main__":
    main()
