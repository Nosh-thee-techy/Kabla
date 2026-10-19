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


def test_fixture_quotes_appear_in_contract_text():
    for sid in samples.SAMPLE_FILES:
        text = " ".join(samples.contract_text(sid).split())
        for clause in samples.fixture(sid)["clauses"]:
            for piece in clause["quote"].split(" ... "):
                assert piece in text, (sid, clause["n"], piece)
