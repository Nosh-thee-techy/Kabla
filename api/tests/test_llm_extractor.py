"""Live-mode extraction is validated against the engine vocabulary (no network in tests)."""
import json

from kabla.services.llm import extract_with_llm


def fake_llm(_prompt: str) -> str:
    return "Here you go:\n" + json.dumps({
        "kind": "recording",
        "parties": {"label": "Test Label", "artist": "Zawadi"},
        "clauses": [
            {"n": 4, "type": "grant", "attrs": ["master", "perpetual", "worldwide", "exclusive"], "quote": "forever"},
            {"n": 7, "type": "ai-training", "attrs": ["granted", "no-opt-in"], "quote": "train AI"},
            {"n": 8, "type": "ai-training", "attrs": ["sure, whatever"], "quote": "bad"},
            {"n": 9, "type": "royalty", "attrs": ["twelve", "recoupable"], "quote": "bad number"},
            {"n": 10, "type": "verdict", "attrs": ["this is unfair"], "quote": "LLM tried to judge"},
            {"n": 11, "type": "splits", "attrs": ["stated", 100], "quote": "100%"},
        ],
    })


def test_llm_output_is_validated_and_judgements_dropped():
    contract = {"id": "u-test", "text": "...", "artist": "zawadi"}
    ex = extract_with_llm(contract, call=fake_llm)
    assert ex["source"] == "llm"
    assert [c["n"] for c in ex["clauses"]] == [4, 7, 11]
    assert {c["n"] for c in ex["dropped"]} == {8, 9, 10}
