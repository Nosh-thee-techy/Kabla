#!/usr/bin/env python3
"""Clone this repo to a temp dir, setup, run tests. Submission gate."""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="kabla-clone-"))
    try:
        subprocess.run(["git", "clone", "--quiet", str(ROOT), str(tmp / "kabla")], check=True)
        dest = tmp / "kabla"
        subprocess.run([sys.executable, "scripts/tasks.py", "setup"], cwd=dest, check=True)
        subprocess.run([sys.executable, "scripts/tasks.py", "test"], cwd=dest, check=True)
        print("clean-clone gate passed")
        return 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
