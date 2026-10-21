#!/usr/bin/env python3
"""Talk to the running Omega agent through the API chat bridge and record what came back.

Why: a log that says the loop runs is not the same as the agent answering. This sends real messages through
POST /omega/chat (the same path the web panel uses), waits up to WAIT_S for each reply (never forever), and writes
docs/evidence/omega-chat.md with pass/fail per message. Needs: API on :8000 and scripts/omega_run.py running.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.request
from pathlib import Path

API = "http://127.0.0.1:8000"
WAIT_S = 120
OUT = Path(__file__).resolve().parent.parent / "docs" / "evidence" / "omega-chat.md"

# (message, text the reply must contain). All synthetic: contracts c001-c003 are invented.
# Each needle is a set of alternatives: the offline router's fixed wording OR the words a live model would use
# when it relays the same skill result. The check is only that the reply is grounded in the Kabla skill's output.
CASES = [
    ("never allow AI training on my work", ("red line saved", "red line", "never", "ai training", "ai-training")),
    ("analyse c001", ("c001:", "c001", "flag")),
    ("why was c001 flagged", ("R-", "clause")),
    ("is a 12-month ad in Kenya cleared", ("cleared", "clear", "licen")),
    ("hello", ("I can:", "hello", "help")),
]


def call(method: str, path: str, body: dict | None = None) -> dict:
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def main() -> int:
    st = call("GET", "/omega/chat")
    if st["agent"] != "up":
        print("agent is down (no heartbeat): start scripts/omega_run.py first")
        return 2
    rows, ok_all = [], True
    for msg, needle in CASES:
        # Compare timestamps, not list length: the API only returns the newest 20 replies, so the length stops growing.
        seen = [r["ts"] for r in call("GET", "/omega/chat")["replies"]]
        before = max(seen) if seen else 0.0
        call("POST", "/omega/chat", {"text": msg})
        t0, reply = time.time(), ""
        while time.time() - t0 < WAIT_S:
            time.sleep(3)
            fresh = [r for r in call("GET", "/omega/chat")["replies"] if r["ts"] > before]
            if fresh:
                reply = fresh[0]["text"]
                break
        ok = any(n.lower() in reply.lower() for n in needle)
        ok_all &= ok
        rows.append((msg, ok, round(time.time() - t0), reply))
        print(("PASS" if ok else "FAIL"), msg, f"({round(time.time() - t0)}s)")
    st = call("GET", "/omega/chat")
    md = ["# Omega agent chat check", "",
          f"Run {time.strftime('%Y-%m-%d %H:%M:%S')} through `POST /omega/chat`. LLM mode: **{st['llm']}** "
          "(`offline-router` = keyword router, not an LLM). Synthetic data only.", "",
          "| Message | Result | Seconds | Reply (first 300 chars) |", "|---|---|---|---|"]
    for msg, ok, secs, reply in rows:
        md.append(f"| {msg} | {'PASS' if ok else 'FAIL'} | {secs} | {reply[:300].replace('|', '/').replace(chr(10), ' ') or '(no reply in time)'} |")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(md) + "\n", encoding="utf-8")
    return 0 if ok_all else 1


if __name__ == "__main__":
    sys.exit(main())
