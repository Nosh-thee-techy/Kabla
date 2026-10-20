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


def say(text: str) -> str:
    """Print a line the demo log can be grepped for, and return it so MeTTa sees a value."""
    print(text, flush=True)
    return str(text)


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


def summarize(analysis_json: str) -> str:
    """One readable line for the demo log: how many flags and which carry a remembered red line.

    Why it exists: the raw analysis is long; the Omega demo prints this so a viewer can see the
    carried red line ("set on <date>") without scrolling. It reads the API's answer, never decides.
    """
    try:
        data = json.loads(analysis_json)
        flags = data["flags"]
    except (ValueError, KeyError, TypeError):
        return f"unreadable answer: {analysis_json[:120]}"
    carried = [f"clause {f['clause']} {f['rule_id']} (red line set {f['redline_set_on']})"
               for f in flags if f.get("redline_set_on")]
    head = f"{data.get('contract_id')}: {len(flags)} flags ({data.get('summary')})"
    return head + (" | remembered red lines: " + "; ".join(carried) if carried else " | no remembered red lines hit")


def explain(contract_id: str, question: str) -> str:
    return _post("/chat", {"contract_id": contract_id, "question": question, "lang": "en"})
