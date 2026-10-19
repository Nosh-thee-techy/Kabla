#!/usr/bin/env python3
"""Run the MeTTa rule tests in engine/tests/ on PeTTa (stdlib only).

Each test file is loaded after engine/main.metta (all rule modules) and
engine/tests/harness.metta. Test lines print (PASS name) or
(FAIL name actual expected). A file fails if any FAIL appears, if it has no
PASS at all, or if PeTTa exits non-zero.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parent
ROOT = ENGINE.parent


def petta_home() -> Path:
    p = Path(os.environ.get("PETTA_HOME", ROOT / ".vendor" / "PeTTa"))
    return p if p.is_absolute() else ROOT / p


def swipl() -> str:
    for c in (os.environ.get("SWIPL"), shutil.which("swipl"), r"C:\Program Files\swipl\bin\swipl.exe"):
        if c and (shutil.which(c) or Path(c).exists()):
            return c
    sys.exit("swipl not found; set SWIPL")


def run_file(test: Path) -> tuple[int, int, list[str]]:
    cmd = [swipl(), "--stack_limit=2g", "-q", "-s", str(petta_home() / "src" / "main.pl"), "--",
           str(ENGINE / "main.metta"), str(ENGINE / "tests" / "harness.metta"), str(test), "--silent"]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    out = proc.stdout
    passed = len(re.findall(r"^\(PASS ", out, re.M))
    failures = [line for line in out.splitlines() if line.startswith("(FAIL ")]
    if proc.returncode != 0:
        failures.append(f"PeTTa exited {proc.returncode}: {proc.stderr.strip()[-800:]}")
    if passed == 0 and not failures:
        failures.append("no PASS lines produced")
    return passed, len(failures), failures


def main() -> int:
    tests = sorted((ENGINE / "tests").glob("test_*.metta"))
    if not tests:
        print("no MeTTa tests found")
        return 0
    total_pass = total_fail = 0
    for t in tests:
        p, f, msgs = run_file(t)
        total_pass += p
        total_fail += f
        print(f"{'OK  ' if f == 0 else 'FAIL'} {t.name}: {p} passed, {f} failed")
        for m in msgs:
            print(f"     {m}")
    print(f"\nMeTTa tests: {total_pass} passed, {total_fail} failed")
    return 1 if total_fail else 0


if __name__ == "__main__":
    sys.exit(main())
