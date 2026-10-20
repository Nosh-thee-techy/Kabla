"""Chat bridge to the Omega agent: two files in var/omega (see omega-plugin/kabla_chat.py).

Why files: the agent runs as a separate process under PeTTa. The API never waits on it: a POST returns at once
and the page polls GET, so a slow, sleeping or dead agent can only ever show as "waiting", never as a hung request.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field

from kabla.config import REPO

router = APIRouter(prefix="/omega", tags=["omega"])

_DIR = Path(os.environ.get("KABLA_OMEGA_DIR", REPO / "var" / "omega"))
_STALE_S = 90  # the runner touches 'heartbeat' about every 15 s while the agent is alive


class OmegaMessage(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


def _replies(limit: int = 20) -> list[dict]:
    f = _DIR / "outbox.jsonl"
    if not f.exists():
        return []
    out = []
    for line in f.read_text(encoding="utf-8").splitlines()[-limit:]:
        try:
            out.append(json.loads(line))
        except ValueError:
            continue  # half-written line; the next poll will have it
    return out


def _status() -> dict:
    hb = _DIR / "heartbeat"
    age = time.time() - hb.stat().st_mtime if hb.exists() else None
    llm = "live" if (os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("OPENAI_API_KEY")) else "offline-router"
    return {
        "agent": "up" if age is not None and age < _STALE_S else "down",
        "heartbeat_age_s": None if age is None else round(age),
        "llm": llm,  # 'offline-router' = keyword router, NOT an LLM
        "note": "Synthetic data only. The agent calls the same MeTTa-backed API as the rest of the app.",
    }


@router.post("/chat")
def send(msg: OmegaMessage) -> dict:
    _DIR.mkdir(parents=True, exist_ok=True)
    mid = int(time.time() * 1000)
    tmp = _DIR / "inbox.tmp"
    tmp.write_text(json.dumps({"id": mid, "text": msg.text}), encoding="utf-8")
    tmp.replace(_DIR / "inbox.json")  # atomic: the agent never reads half a message
    return {"id": mid, **_status()}


@router.get("/chat")
def read() -> dict:
    return {"replies": _replies(), **_status()}
