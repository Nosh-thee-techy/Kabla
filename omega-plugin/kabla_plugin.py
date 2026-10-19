"""Python helpers for the Kabla Omega plugin. No verdicts here — HTTP only."""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

BASE = os.environ.get("KABLA_API_URL", "http://127.0.0.1:8000")


def _post(path: str, body: dict) -> str:
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(BASE + path, data=data, method="POST",
                                 headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.URLError as exc:
        return json.dumps({"error": str(exc)})


def analyze(sample_id: str) -> str:
    created = json.loads(_post("/contracts", {"sample_id": sample_id}))
    return _post(f"/contracts/{created.get('id', sample_id)}/analyze", {})


def licence(use: str, territory: str, months: int, party: str) -> str:
    return _post("/licence/check", {
        "work_id": "w-asali", "use": use, "territory": territory,
        "months": int(months), "party": party,
    })


def redline_set(artist: str, kind: str, value: str) -> str:
    parsed: str | int = int(value) if kind == "term-max-years" else value
    return _post("/redlines", {"artist": artist, "kind": kind, "value": parsed})


def explain(contract_id: str, question: str) -> str:
    return _post("/chat", {"contract_id": contract_id, "question": question, "lang": "en"})
