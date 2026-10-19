#!/usr/bin/env python3
"""Cross-platform task runner. `make <target>` on Linux/macOS calls this;
on Windows run `python scripts/tasks.py <target>` directly.

Targets: setup | run | api | web | test | test-metta | test-api | demo | verify | lint
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = ROOT / "api"
WEB = ROOT / "web"
VENV = API / ".venv"
IS_WIN = os.name == "nt"


def sh(cmd: list[str], cwd: Path = ROOT, env: dict | None = None, check: bool = True) -> int:
    print(f"$ {' '.join(str(c) for c in cmd)}", flush=True)
    merged = {**os.environ, **(env or {})}
    proc = subprocess.run([str(c) for c in cmd], cwd=cwd, env=merged, shell=IS_WIN and cmd[0] in ("npm", "npx"))
    if check and proc.returncode != 0:
        sys.exit(proc.returncode)
    return proc.returncode


def venv_python() -> Path:
    return VENV / ("Scripts/python.exe" if IS_WIN else "bin/python")


def load_dotenv() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


def setup() -> None:
    sh([sys.executable, str(ROOT / "scripts" / "setup_petta.py")])
    if not VENV.exists():
        if shutil.which("uv"):
            sh(["uv", "venv", "--python", "3.12", str(VENV)])
        else:
            sh([sys.executable, "-m", "venv", str(VENV)])
    py = venv_python()
    if shutil.which("uv"):
        sh(["uv", "pip", "install", "--python", str(py), "-e", f"{API}[dev]"])
    else:
        sh([str(py), "-m", "pip", "install", "-e", f"{API}[dev]"])
    sh([str(py), "-m", "kabla.cli", "init"], cwd=API)
    if (WEB / "package.json").exists():
        sh(["npm", "install"], cwd=WEB)
    if not (ROOT / ".env").exists():
        shutil.copy(ROOT / ".env.example", ROOT / ".env")
        print("created .env from .env.example")


def api() -> None:
    sh([str(venv_python()), "-m", "uvicorn", "kabla.main:app", "--port", "8000", "--reload"], cwd=API)


def web() -> None:
    sh(["npm", "run", "dev"], cwd=WEB)


def run() -> None:
    api_proc = subprocess.Popen([str(venv_python()), "-m", "uvicorn", "kabla.main:app", "--port", "8000"], cwd=API)
    try:
        print("\nKabla API  -> http://localhost:8000/health")
        print("Kabla web  -> http://localhost:5173\n")
        sh(["npm", "run", "dev"], cwd=WEB, check=False)
    finally:
        api_proc.terminate()


def test_metta() -> None:
    sh([sys.executable, str(ROOT / "engine" / "run_tests.py")])


def test_api() -> None:
    sh([str(venv_python()), "-m", "pytest", "-q"], cwd=API)


def test() -> None:
    test_metta()
    test_api()
    if (WEB / "node_modules").exists():
        sh(["npm", "run", "build"], cwd=WEB)


def demo() -> None:
    sh([str(venv_python()), str(ROOT / "scripts" / "e2e_demo.py")], cwd=ROOT)


def verify() -> None:
    sh([sys.executable, str(ROOT / "scripts" / "verify_clean_clone.py")])


def lint() -> None:
    sh([str(venv_python()), "-m", "ruff", "check", "kabla", "tests"], cwd=API)


TARGETS = {
    "setup": setup, "run": run, "api": api, "web": web, "test": test,
    "test-metta": test_metta, "test-api": test_api, "demo": demo, "verify": verify, "lint": lint,
}

if __name__ == "__main__":
    load_dotenv()
    if len(sys.argv) != 2 or sys.argv[1] not in TARGETS:
        print(__doc__)
        sys.exit(2)
    TARGETS[sys.argv[1]]()
