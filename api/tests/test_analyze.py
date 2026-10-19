from fastapi.testclient import TestClient

from kabla.main import app


def test_c001_analyze_has_five_red_flags_and_trail(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c001"})
    body = client.post("/contracts/c001/analyze").json()
    assert body["extraction_source"] == "fixture"
    red = [f for f in body["flags"] if f["severity"] == "red"]
    amber = [f for f in body["flags"] if f["severity"] == "amber"]
    assert {f["rule_id"] for f in red} == {"R-GRANT-01", "R-TERM-01", "R-AI-01", "R-VOICE-01"}
    assert {f["rule_id"] for f in amber} >= {"R-ROY-01", "R-REVERT-01", "R-XCOLL-01", "R-OPT-01"}
    clause7 = next(f for f in body["flags"] if f["clause"] == 7)
    assert clause7["rule_id"] == "R-AI-01"
    assert any("2026-10-19" in line["text_en"] and "never" in line["text_en"] for line in clause7["trail"])
    assert any("2026-10-19" in line["text_sw"] for line in clause7["trail"])
    assert body["summary"]["red"] == 4
    assert body["clause_severity"]["7"] == "red"


def test_c003_does_not_cry_wolf(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c003"})
    body = client.post("/contracts/c003/analyze").json()
    assert [f["rule_id"] for f in body["flags"]] == ["R-SPLIT-01"]
    assert body["flags"][0]["severity"] == "amber"


def test_simulate_is_labelled_illustrative(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c001"})
    body = client.post("/contracts/c001/simulate", json={"streams": 5_000_000}).json()
    assert body["illustrative"] is True
    assert body["as_written"]["artist_keeps"] == 2000
    assert body["counter"]["artist_keeps"] == 2700.0
