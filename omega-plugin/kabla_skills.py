"""Python helpers for the Kabla Omega plugin. No verdicts here: HTTP only, MeTTa (inside the API) decides."""
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
        # Timeout so a sleeping or dead API shows up as an error line, never as a frozen agent loop.
        with urllib.request.urlopen(req, timeout=60) as resp:
            return resp.read().decode("utf-8")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return json.dumps({"error": f"Kabla API unreachable or slow: {exc}"})


def say(text: str) -> str:
    """Print a line the demo log can be grepped for, and return it so MeTTa sees a value."""
    print(text, flush=True)
    return str(text)


def _clean(s: str) -> str:
    """Digest text must survive being printed inside a Python list repr: no quotes, backslashes or newlines."""
    return " ".join(str(s).replace("\\", " ").replace('"', " ").replace("'", " ").split())[:600]


def _tag(digest: str, raw: str) -> str:
    """Prefix a one-line, human-readable DIGEST to the raw JSON. Why: a keyword-router fallback (or a small model)
    can relay the digest without parsing JSON; the full JSON stays below it for a real LLM to read."""
    return f"DIGEST: {_clean(digest)}\n{raw}"


def analyze(sample_id: str) -> str:
    created = json.loads(_post("/contracts", {"sample_id": sample_id}))
    if "error" in created:
        return _tag(created["error"], json.dumps(created))
    raw = _post(f"/contracts/{created.get('id', sample_id)}/analyze", {})
    return _tag(summarize(raw), raw)


def licence(use: str, territory: str, months: int, party: str) -> str:
    raw = _post("/licence/check", {
        "work_id": "w-asali", "use": use, "territory": territory,
        "months": int(months), "party": party,
    })
    try:
        d = json.loads(raw)
        return _tag(f"{d['verdict']} ({d['rule_id']}): {d['headline_en']}", raw)
    except (ValueError, KeyError, TypeError):
        return _tag("licence check did not return a verdict", raw)


def redline_set(artist: str, kind: str, value: str) -> str:
    parsed: str | int = int(value) if kind == "term-max-years" else value
    raw = _post("/redlines", {"artist": artist, "kind": kind, "value": parsed})
    return _tag(f"red line saved for {artist}: {kind} {value} (remembered across contracts)", raw)


def summarize(analysis_json: str) -> str:
    """One readable line for the demo log: how many flags and which carry a remembered red line.

    Why it exists: the raw analysis is long; the Omega demo prints this so a viewer can see the
    carried red line ("set on <date>") without scrolling. It reads the API's answer, never decides.
    """
    if analysis_json.startswith("DIGEST:"):  # skills prefix a digest line; read the JSON below it
        analysis_json = analysis_json.split("\n", 1)[-1]
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
    raw = _post("/chat", {"contract_id": contract_id, "question": question, "lang": "en"})
    try:
        return _tag(json.loads(raw)["answer"], raw)
    except (ValueError, KeyError, TypeError):
        return _tag("no explanation available", raw)
