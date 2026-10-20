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
# Omega's Dockerfile pins PeTTa v1.0.4. The project's engine pin (fea83178) hit a type-check error inside Omega's
# init code, so the agent gets its own v1.0.4 checkout and Kabla's MeTTa engine keeps its pin untouched.
_OMEGA_PETTA = ROOT / ".vendor" / "PeTTa-omega"
PETTA = _OMEGA_PETTA if _OMEGA_PETTA.exists() else ROOT / ".vendor" / "PeTTa"
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
    # Restaging replaces the whole copy, but the agent's memory must survive a restart: keep its history file.
    old_history = dest / "memory" / "history.metta"
    kept = old_history.read_bytes() if old_history.exists() else None
    if dest.exists():
        shutil.rmtree(dest, ignore_errors=True)
    shutil.copytree(OMEGA_SRC, dest, ignore=shutil.ignore_patterns(".git", "Autotests", "tests", "docs"))
    if kept is not None:
        (dest / "memory").mkdir(parents=True, exist_ok=True)
        (dest / "memory" / "history.metta").write_bytes(kept)
    shutil.copytree(ROOT / "omega-plugin", dest / "plugins" / "kabla",
                    ignore=shutil.ignore_patterns("demo", "__pycache__", "README.md", "tests"), dirs_exist_ok=True)
    plug = (dest / "plugins" / "kabla").as_posix()
    (dest / "config" / "plugins.yaml").write_text(
        f'- name: kabla_plugin\n  loader: metta\n  location: "{plug}"\n'
        f'- name: kabla_llm\n  loader: python\n  location: "{plug}"\n'
        f'- name: kabla_chat\n  loader: python\n  location: "{plug}"\n', encoding="utf-8")
    cfg_path = dest / "config" / "config.yaml"
    cfg = cfg_path.read_text(encoding="utf-8")
    # Memory lives inside the staged copy (git-ignored). Absolute Windows paths made PeTTa's config atoms fail
    # with a type mismatch, so these two stay relative to the PeTTa folder, exactly like Omega's own defaults.
    for k, v in {
        "provider": "Kabla",
        "commchannel": "kabla",
        "securityPolicyPath": '""',              # landlock is Linux-only
        "memoryDirectory": '"./repos/Omega/memory"',
        "chromaDbPath": '"./chroma_db"',
        "sleepInterval": "2",
        "wakeupInterval": "900",
        "knowledgeIndexingBackground": "true",  # do not hold the first reply behind knowledge indexing
    }.items():
        cfg = set_yaml(cfg, k, v)
    cfg_path.write_text(cfg, encoding="utf-8")
    # Omega hard-codes the 1.3 GB intfloat/e5-large-v2 for local embeddings. On a slow link that download can
    # take hours, so the STAGED copy (never the upstream repo) reads the model name from OMEGA_EMBED_MODEL and
    # we default it to a ~90 MB model. Memory works the same, with coarser recall. Recorded in docs/DECISIONS.md.
    ext = dest / "providers" / "lib_llm_ext.py"
    code = ext.read_text(encoding="utf-8")
    patched = code.replace('model_name="intfloat/e5-large-v2"',
                           'model_name=__import__("os").environ.get("OMEGA_EMBED_MODEL", "intfloat/e5-large-v2")')
    if patched == code:
        print("WARNING: embedding model line not found; Omega will download e5-large-v2 (1.3 GB)")
    ext.write_text(patched, encoding="utf-8")
    # initLoop's eighth `configure`, whose default is a (joinPath ...) call, fails on this PeTTa/Windows setup with
    # "Type mismatch: got true but expected List" (dropping any one of the other seven makes it pass; cause not
    # found). The config file already supplies memoryDirectory, so the staged copy uses the same literal default.
    loop = dest / "src" / "loop.metta"
    ltxt = loop.read_text(encoding="utf-8")
    fixed = re.sub(r"\(configure memoryDirectory\s+\(joinPath \(\(py-call \(helper\.projectRootDirectory\)\) memory\)\)\)",
                   '(configure memoryDirectory "./repos/Omega/memory")', ltxt)
    if fixed == ltxt:
        print("WARNING: initLoop memoryDirectory line not found; the agent may fail to start")
    loop.write_text(fixed, encoding="utf-8")
    # Omega's policy.py imports py_landlock at import time, and Landlock only exists on Linux. With
    # securityPolicyPath empty Omega never calls it, so a stub that refuses to run keeps the import happy
    # without pretending a sandbox exists.
    (dest / "py_landlock.py").write_text(
        '"""Windows stub: Landlock is Linux-only. Importing works; using it fails loudly."""\n'
        '# policy.py ORs these flags together at import time, so they must be plain ints; they are never applied.\n'
        'class _Flags:\n    def __getattr__(self, n):\n        return 0\n'
        'AccessFs = _Flags()\n'
        'class Landlock:\n    def __init__(self, *a, **k):\n        raise NotImplementedError("Landlock is not available on Windows")\n',
        encoding="utf-8")
    (dest / "memory").mkdir(parents=True, exist_ok=True)
    hist = dest / "memory" / "history.metta"
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
    env.setdefault("OMEGA_EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    # PeTTa's lib_llm.metta builds an OpenAI client at import and crashes if OPENAI_API_KEY is unset, even when
    # that client is never used. With no real key we give it an obvious placeholder and tell Kabla's provider
    # to ignore it (KABLA_OFFLINE_ONLY), so the placeholder can never be mistaken for a live LLM.
    if not (env.get("OPENAI_API_KEY") or env.get("ANTHROPIC_API_KEY")):
        env["OPENAI_API_KEY"] = "placeholder-not-a-real-key"
        env["KABLA_OFFLINE_ONLY"] = "1"
    # The Omega repo root must be importable too: its providers do `from src.logger import ...` (Docker runs from there).
    omega_root = str(PETTA / "repos" / "Omega")
    env["PYTHONPATH"] = os.pathsep.join(p for p in (str(SITE), omega_root, env.get("PYTHONPATH", "")) if p)
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
                # Omega logs the whole prompt on every REQUEST line (kilobytes, every 2 s). Cap each line so an
                # overnight run stays small enough to read and to attach as evidence.
                logf.write(line if len(line) <= 400 else line[:400].rstrip() + " ...[cut]\n")
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
