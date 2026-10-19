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
    from kabla.services.llm import extract_with_llm

    return extract_with_llm(contract)
