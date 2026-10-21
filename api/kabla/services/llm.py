"""Live mode only: ask an LLM to READ a contract and return clause facts.

The LLM never judges a clause. Its JSON is validated against the engine's
vocabulary; anything outside it is dropped and reported, and every kept fact
carries the quote it came from so the artist can challenge it.
"""
from __future__ import annotations

import json
import os
import re

import httpx

from kabla.config import get_settings

ALLOWED: dict[str, list[set | type]] = {
    "grant": [{"master", "composition", "artwork"}, {"perpetual", "term-limited"},
              {"worldwide", "africa", "east-africa", "kenya"}, {"exclusive", "non-exclusive"}],
    "term": [int | str],
    "advance": [int],
    "royalty": [int, {"recoupable", "non-recoupable"}],
    "reversion": [int | str],
    "cross-collateral": [{"yes", "no"}],
    "option-periods": [int, {"label-only", "mutual"}],
    "audit": [{"yes", "none"}],
    "sync-approval": [{"label-only", "artist-approval"}],
}
VARIANTS = {
    "ai-training": [["granted", "no-opt-in"], ["vague"], ["opt-in-paid"], ["prohibited"]],
    "voice-likeness": [["granted", "synthetic-voice"], ["granted", "promo-only"]],
}

PROMPT = """You read music and art contracts. Extract clause FACTS only; do not judge them.
Return JSON: {"kind": "recording|publishing|distribution", "parties": {"label": str, "artist": str},
"clauses": [{"n": clause number, "type": str, "attrs": [...], "quote": exact short quote}]}.
Allowed types and attrs:
- grant: [master|composition|artwork, perpetual|term-limited, worldwide|africa|east-africa|kenya,
  exclusive|non-exclusive]
- term: [years as integer, or "perpetual"]   - advance: [amount as integer]
- royalty: [percent as integer, recoupable|non-recoupable]
- ai-training: ["granted","no-opt-in"] | ["vague"] | ["opt-in-paid"] | ["prohibited"]
- voice-likeness: ["granted","synthetic-voice"] | ["granted","promo-only"]
- reversion: ["none"] or [years as integer]   - cross-collateral: [yes|no]
- option-periods: [count as integer, label-only|mutual]   - audit: [yes|none]
- sync-approval: [label-only|artist-approval]   - splits: ["stated", total as integer] | ["not-stated"]
Only include clauses you can quote. Output JSON only.

CONTRACT:
"""


def _valid(clause: dict) -> bool:
    ctype, attrs = clause.get("type"), clause.get("attrs")
    if not isinstance(clause.get("n"), int) or not isinstance(attrs, list):
        return False
    if ctype in VARIANTS:
        return attrs in VARIANTS[ctype]
    if ctype == "splits":
        return attrs == ["not-stated"] or (len(attrs) == 2 and attrs[0] == "stated" and isinstance(attrs[1], int))
    spec = ALLOWED.get(ctype)
    if spec is None or len(spec) != len(attrs):
        return False
    for allowed, value in zip(spec, attrs, strict=True):
        if isinstance(allowed, set):
            if value not in allowed:
                return False
        elif not isinstance(value, allowed):
            return False
    if ctype == "term" and isinstance(attrs[0], str) and attrs[0] != "perpetual":
        return False
    if ctype == "reversion" and isinstance(attrs[0], str) and attrs[0] != "none":
        return False
    return True


def validate(raw: dict, contract: dict) -> dict:
    clauses, dropped = [], []
    for c in raw.get("clauses", []):
        (clauses if _valid(c) else dropped).append(c)
    kind = raw.get("kind") if raw.get("kind") in ("recording", "publishing", "distribution") else "recording"
    return {
        "contract_id": contract["id"], "kind": contract.get("kind") or kind, "artist": contract.get("artist", "zawadi"),
        "parties": raw.get("parties") or {"label": contract.get("label") or "Counterparty", "artist": "Artist"},
        "policy": None, "clauses": [{**c, "quote": str(c.get("quote", ""))[:300]} for c in clauses],
        "dropped": dropped, "source": "llm",
    }


def _call(prompt: str) -> str:
    s = get_settings()
    if s.llm_provider == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        # Any OpenAI-compatible server works (e.g. OpenRouter): set KABLA_LLM_URL to its /v1 base.
        base = os.environ.get("KABLA_LLM_URL", "https://api.openai.com/v1").rstrip("/")
        body = {"model": s.llm_model or "gpt-4o-mini", "temperature": 0, "max_tokens": 3000,
                "messages": [{"role": "user", "content": prompt}]}
        if "openrouter.ai" in base:
            # Reasoning models otherwise put their planning before the JSON; only sent to OpenRouter because
            # other servers may reject an unknown field. extract_with_llm also tolerates text around the JSON.
            body["reasoning"] = {"enabled": False}
        resp = httpx.post(f"{base}/chat/completions", timeout=90,
                          headers={"Authorization": f"Bearer {key}"}, json=body)
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"] or ""
    key = os.environ.get("ANTHROPIC_API_KEY")
    resp = httpx.post("https://api.anthropic.com/v1/messages", timeout=60,
                      headers={"x-api-key": key or "", "anthropic-version": "2023-06-01"},
                      json={"model": s.llm_model or "claude-sonnet-4-5", "max_tokens": 2000, "temperature": 0,
                            "messages": [{"role": "user", "content": prompt}]})
    resp.raise_for_status()
    return resp.json()["content"][0]["text"]


def extract_with_llm(contract: dict, call=_call) -> dict:
    text = call(PROMPT + contract["text"][:20000])
    match = re.search(r"\{.*\}", text, re.S)
    if not match:
        raise ValueError("LLM returned no JSON")
    return validate(json.loads(match.group(0)), contract)
