import pytest
from fastapi.testclient import TestClient

from kabla.main import app
from kabla.services import samples
from kabla.services.extractor import ExtractionUnavailable, extract


def test_samples_listed_and_synthetic(fresh_store):
    body = TestClient(app).get("/samples").json()
    assert [c["id"] for c in body["contracts"]] == ["c001", "c002", "c003"]
    assert body["synthetic"] is True


def test_fixture_extraction_for_sample(fresh_store):
    contract = TestClient(app).post("/contracts", json={"sample_id": "c001"}).json()
    ex = extract(fresh_store.get_contract(contract["id"]))
    assert ex["source"] == "fixture"
    assert {c["n"] for c in ex["clauses"]} >= {4, 5, 7, 9, 11, 13, 15, 18}


def test_pasted_sample_text_maps_to_fixture(fresh_store):
    text = "  " + samples.contract_text("c003").replace("\n", "\n\n")
    contract = TestClient(app).post("/contracts", json={"text": text}).json()
    assert contract["id"] == "c003"


def test_unknown_text_needs_live_mode(fresh_store):
    contract = TestClient(app).post("/contracts", json={"text": "1. GRANT\nSomething new."}).json()
    assert contract["id"].startswith("u-")
    with pytest.raises(ExtractionUnavailable):
        extract(fresh_store.get_contract(contract["id"]))


def test_pasted_text_in_deterministic_mode_gets_a_clear_422(fresh_store):
    """The reviewer path: unknown text must give a readable message, not a 500."""
    client = TestClient(app)
    contract = client.post("/contracts", json={"text": "1. GRANT\nSomething new."}).json()
    res = client.post(f"/contracts/{contract['id']}/analyze")
    assert res.status_code == 422
    assert "SYNTHETIC" in res.json()["detail"]


def test_live_mode_without_key_says_so(fresh_store, monkeypatch):
    from kabla.config import get_settings

    monkeypatch.setenv("KABLA_MODE", "live")
    # Pin the provider: a developer's own .env may select another one (and hold its key).
    monkeypatch.setenv("KABLA_LLM_PROVIDER", "anthropic")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    get_settings.cache_clear()
    try:
        contract = TestClient(app).post("/contracts", json={"text": "1. GRANT\nSomething new."}).json()
        with pytest.raises(ExtractionUnavailable, match="ANTHROPIC_API_KEY"):
            extract(fresh_store.get_contract(contract["id"]))
    finally:
        monkeypatch.undo()
        get_settings.cache_clear()


def test_fixture_quotes_appear_in_contract_text():
    for sid in samples.SAMPLE_FILES:
        text = " ".join(samples.contract_text(sid).split())
        for clause in samples.fixture(sid)["clauses"]:
            for piece in clause["quote"].split(" ... "):
                assert piece in text, (sid, clause["n"], piece)
