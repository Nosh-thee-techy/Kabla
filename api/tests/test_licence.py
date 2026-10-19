from fastapi.testclient import TestClient

from kabla.main import app


def _check(client, **kwargs):
    return client.post("/licence/check", json={"work_id": "w-asali", **kwargs}).json()


def test_request_a_ad_kenya_cleared(fresh_store):
    body = _check(TestClient(app), use="ad", territory="KE", months=6, party="Nuru Soaps")
    assert body["verdict"] == "cleared"
    assert body["rule_id"] == "R-LIC-OK"
    assert any(c["key"] == "no-ai-training" for c in body["conditions"])
    assert "Baraka" not in body["headline_en"]


def test_request_b_ai_training_not_cleared(fresh_store):
    body = _check(TestClient(app), use="ai-training", territory="WW", months=12, party="Nuru Labs")
    assert body["verdict"] == "not-cleared"
    assert body["rule_id"] == "R-LIC-AI"
    assert "never" in body["headline_en"]
    assert "2026-10-19" in body["headline_en"]
    assert "kamwe" in body["headline_sw"]


def test_request_c_film_us_needs_baraka(fresh_store):
    body = _check(TestClient(app), use="sync-film", territory="US", months=3, party="Exhibition")
    assert body["verdict"] == "needs-consent"
    assert body["rule_id"] == "R-LIC-CONSENT"
    assert [(m["person"], m["share"]) for m in body["missing"]] == [("baraka", 40)]
    assert "Baraka" in body["headline_en"] and "40%" in body["headline_en"]
