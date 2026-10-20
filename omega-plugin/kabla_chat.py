"""Kabla chat channel for Omega: two plain files, so anything can talk to the agent.

Why files: Omega's stock channels (IRC, Slack, Telegram...) need accounts and tokens, and its mock channel needs
a test server. Two files need nothing, survive restarts, and are easy to inspect while debugging:

  <dir>/inbox.json    {"id": N, "text": "..."}   written by the Kabla API (POST /omega/chat) or by hand
  <dir>/outbox.jsonl  one JSON line per agent reply: {"ts": ..., "text": "..."}

<dir> is KABLA_OMEGA_DIR (default var/omega under the repo). Each inbox id is delivered to the agent once.
The channel never blocks: receive() returns "" when there is nothing new, so a quiet chat cannot stall the loop.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import channels


def _dir() -> Path:
    d = Path(os.environ.get("KABLA_OMEGA_DIR", "var/omega"))
    d.mkdir(parents=True, exist_ok=True)
    return d


class KablaChat(channels.CommChannel):
    def __init__(self):
        super().__init__()
        self.seen = 0

    def start(self) -> None:
        # Start from whatever id is already there so a restart does not replay an old message.
        try:
            self.seen = int(json.loads((_dir() / "inbox.json").read_text(encoding="utf-8")).get("id", 0))
        except Exception:
            self.seen = 0
        (_dir() / "alive").write_text(str(time.time()), encoding="utf-8")

    def receive(self) -> str:
        try:
            data = json.loads((_dir() / "inbox.json").read_text(encoding="utf-8"))
            if int(data.get("id", 0)) > self.seen:
                self.seen = int(data["id"])
                return str(data.get("text", ""))
        except (OSError, ValueError):
            pass  # no file yet, or a half-written one: try again next turn
        return ""

    def send(self, message: str) -> None:
        with (_dir() / "outbox.jsonl").open("a", encoding="utf-8") as f:
            f.write(json.dumps({"ts": time.time(), "text": message}, ensure_ascii=False) + "\n")


def loadOmegaPlugin():
    channels.registerCommChannel("kabla", KablaChat())
