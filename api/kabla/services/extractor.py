"""Clause extraction: contract text -> structured clause facts.

deterministic mode: reviewed fixtures in data/extractions/ (no LLM, no network).
live mode: an LLM reads the text and returns the same JSON shape (see llm.py).
The extractor only reads. It never decides whether a clause is a problem.
"""
from __future__ import annotations

from kabla.config import get_settings
from kabla.services import samples


class ExtractionUnavailable(RuntimeError):
    pass


def extract(contract: dict) -> dict:
    sample_id = contract.get("sample_id")
    if sample_id:
        fx = samples.fixture(sample_id)
        return {**fx, "contract_id": contract["id"], "artist": contract.get("artist", fx["artist"]),
                "source": "fixture"}
    if get_settings().deterministic:
        raise ExtractionUnavailable(
            "Deterministic mode only reads the three SYNTHETIC sample contracts (pre-extracted fixtures). "
            "Set KABLA_MODE=live and an LLM key to extract clauses from other text.")
    import json
    import os

    import httpx

    from kabla.services.llm import extract_with_llm

    # Why these checks: a pasted contract is the first thing a reviewer tries. A missing key or a provider
    # hiccup must come back as a plain sentence, never as "Internal Server Error".
    provider = get_settings().llm_provider
    key_name = "OPENAI_API_KEY" if provider == "openai" else "ANTHROPIC_API_KEY"
    if not os.environ.get(key_name):
        raise ExtractionUnavailable(
            f"Live mode is on but {key_name} is not set, so Kabla cannot read new contract text. "
            "Use one of the three SYNTHETIC sample folders, or add the key to .env and restart the API.")
    try:
        return extract_with_llm(contract)
    except (httpx.HTTPError, ValueError, json.JSONDecodeError) as exc:
        raise ExtractionUnavailable(
            f"The reader could not extract clauses from this text ({type(exc).__name__}). "
            "Nothing was decided. Try a shorter excerpt or one of the SYNTHETIC samples.") from exc
