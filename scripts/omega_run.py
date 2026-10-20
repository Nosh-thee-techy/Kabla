#!/usr/bin/env python3
"""Run the real Omega agent loop natively on Windows, supervised by a watchdog.

What it does (and why each part exists):
  1. Stages a copy of Omega (https://github.com/singnet/Omega, Apache-2.0) under .vendor/PeTTa/repos/Omega
     with a config that selects Kabla's own LLM provider ("Kabla": a real LLM if a key is in .env, otherwise an
     offline keyword router) and Kabla's file chat channel. Landlock sandboxing is switched off because it is
     Linux-only; this is recorded in docs/DECISIONS.md.
  2. Loads .env into the child's environment WITHOUT printing it. A key can be added any time; restart this script.
  3. Runs omega-plugin/demo/kabla_agent.metta under swipl and mirrors output to docs/evidence/omega-agent.log.
  4. Watchdog: touches var/omega/heartbeat only while the agent log keeps growing. If the log is silent for
     STALL_S the process is killed and restarted (up to MAX_RESTARTS) so a hung call or sleeping machine
     cannot leave the agent dead overnight. The API reads the heartbeat to show agent up/down.

Usage:  python scripts/omega_run.py [--minutes N]        (API on :8000; needs the Omega Python deps installed)
        python scripts/omega_run.py --stage-only         (just stage the files, for inspection)
"""
from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PETTA = ROOT / ".vendor" / "PeTTa"
OMEGA_SRC = Path(os.environ.get("OMEGA_SRC", Path.home() / "omega-src"))
SITE = ROOT / ".vendor" / "omega-site"
RUN_DIR = ROOT / "var" / "omega"
LOG = ROOT / "docs" / "evidence" / "omega-agent.log"
SWIPL = os.environ.get("SWIPL", r"C:\Program Files\swipl\bin\swipl.exe")
STALL_S = int(os.environ.get("OMEGA_STALL_S", "300"))   # silent this long = hung (a model call is capped at ~45 s)
MAX_RESTARTS = int(os.environ.get("OMEGA_MAX_RESTARTS", "5"))


def load_env() -> dict[str, str]:
    """Read .env into a dict. Values are never printed or logged."""
    env: dict[str, str] = {}
    f = ROOT / ".env"
    if f.exists():
        for raw in f.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if v.strip():
                    env[k.strip()] = v.strip()
    return env


def set_yaml(text: str, key: str, value: str) -> str:
    """Replace a top-level `key: ...` line in Omega's config.yaml (keeps comments)."""
    pat = re.compile(rf"^{re.escape(key)}:.*$", re.M)
    line = f"{key}: {value}"
    return pat.sub(line, text, count=1) if pat.search(text) else text + f"\n{line}\n"


def stage() -> Path:
    dest = PETTA / "repos" / "Omega"
    if dest.exists():
        shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(OMEGA_SRC, dest, ignore=shutil.ignore_patterns(".git", "Autotests", "tests", "docs"))
    shutil.copytree(ROOT / "omega-plugin", dest / "plugins" / "kabla",
                    ignore=shutil.ignore_patterns("demo", "__pycache__", "README.md", "tests"), dirs_exist_ok=True)
    plug = (dest / "plugins" / "kabla").as_posix()
    (dest / "config" / "plugins.yaml").write_text(
        f'- name: kabla_plugin\n  loader: metta\n  location: "{plug}"\n'
        f'- name: kabla_llm\n  loader: python\n  location: "{plug}"\n'
        f'- name: kabla_chat\n  loader: python\n  location: "{plug}"\n', encoding="utf-8")
    cfg_path = dest / "config" / "config.yaml"
    cfg = cfg_path.read_text(encoding="utf-8")
    mem = (RUN_DIR / "memory").as_posix()
    for k, v in {
        "provider": "Kabla",
        "commchannel": "kabla",
        "securityPolicyPath": '""',              # landlock is Linux-only
        "memoryDirectory": f'"{mem}"',
        "chromaDbPath": f'"{(RUN_DIR / "chroma").as_posix()}"',
        "sleepInterval": "2",
        "wakeupInterval": "900",
        "knowledgeIndexingBackground": "true",  # do not hold the first reply behind knowledge indexing
    }.items():
        cfg = set_yaml(cfg, k, v)
    cfg_path.write_text(cfg, encoding="utf-8")
    (RUN_DIR / "memory").mkdir(parents=True, exist_ok=True)
    hist = RUN_DIR / "memory" / "history.metta"
    if not hist.exists():
        hist.write_text("", encoding="utf-8")
    tpl = (ROOT / "omega-plugin" / "demo" / "kabla_agent.metta").read_text(encoding="utf-8")
    (PETTA / "kabla_agent.metta").write_text(tpl.replace("{PLUGIN_DIR}", plug), encoding="utf-8")
    return dest


def child_env(extra: dict[str, str]) -> dict[str, str]:
    env = dict(os.environ, **extra)
    env["KABLA_API_URL"] = "http://127.0.0.1:8000"
    env["KABLA_OMEGA_DIR"] = str(RUN_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    env["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
    env["PYTHONPATH"] = os.pathsep.join(p for p in (str(SITE), env.get("PYTHONPATH", "")) if p)
    return env


def run_once(extra_env: dict[str, str], deadline: float | None) -> str:
    """Start swipl, mirror output to the log, return 'exit', 'stalled' or 'deadline'."""
    cmd = [SWIPL, "--stack_limit=2g", "-q", "-s", str(PETTA / "src" / "main.pl"), "--", "kabla_agent.metta", "--silent"]
    LOG.parent.mkdir(parents=True, exist_ok=True)
    state = {"last": time.time()}
    with LOG.open("a", encoding="utf-8", errors="replace") as logf:
        logf.write(f"\n=== start {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
        proc = subprocess.Popen(cmd, cwd=PETTA, env=child_env(extra_env), stdout=subprocess.PIPE,
                                stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")

        def pump() -> None:
            assert proc.stdout
            for line in proc.stdout:
                state["last"] = time.time()
                logf.write(line)
                logf.flush()

        threading.Thread(target=pump, daemon=True).start()
        why = "exit"
        while proc.poll() is None:
            time.sleep(5)
            now = time.time()
            if now - state["last"] < STALL_S:
                (RUN_DIR / "heartbeat").write_text(str(now), encoding="utf-8")  # alive AND making progress
            else:
                why = "stalled"
                break
            if deadline and now > deadline:
                why = "deadline"
                break
        if proc.poll() is None:
            proc.kill()
        logf.write(f"=== end ({why}) {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n")
    return why


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--minutes", type=float, default=0, help="stop after N minutes (0 = run until stopped)")
    ap.add_argument("--stage-only", action="store_true")
    a = ap.parse_args()
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    stage()
    if a.stage_only:
        print("staged")
        return 0
    extra = load_env()
    print("LLM:", "live key found in .env" if ("ANTHROPIC_API_KEY" in extra or "OPENAI_API_KEY" in extra)
          else "no key: offline keyword router (not an LLM)")
    deadline = time.time() + a.minutes * 60 if a.minutes else None
    restarts = 0
    while True:
        why = run_once(extra, deadline)
        print("agent ended:", why)
        if why == "deadline" or (deadline and time.time() > deadline):
            return 0
        restarts += 1
        if restarts > MAX_RESTARTS:
            print("too many restarts, giving up (see docs/evidence/omega-agent.log)")
            return 1
        time.sleep(min(60, 5 * restarts))   # back off, then bring the agent back


if __name__ == "__main__":
    sys.exit(main())
