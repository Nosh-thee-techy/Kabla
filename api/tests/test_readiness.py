from fastapi.testclient import TestClient

from kabla.main import app


def test_c001_readiness_as_written_worse_than_after(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c001"})
    client.post("/contracts/c001/analyze")
    body = client.get("/contracts/c001/readiness").json()
    assert body["label"] == "rights-health, not credit"
    assert body["fairness"]["red"] == 4
    assert body["fairness"]["amber"] == 4
    assert "red" in body["fairness"]["line"]
    assert body["as_written"]["score"] < body["after"]["score"]
    assert any(r["type"] == "unresolved-red-signed" for r in body["as_written"]["reasons"])
    assert any(r["type"] == "contract-clean" for r in body["after"]["reasons"])
    assert body["projected"] is True
    keys = {i["key"] for i in body["checklist"]}
    assert keys == {"red-lines", "ai-stance", "splits", "consents"}
    assert all("ok" in i and "warning_en" in i for i in body["checklist"])


def test_c003_fair_deal_as_written_matches_after(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c003"})
    client.post("/contracts/c003/analyze")
    body = client.get("/contracts/c003/readiness").json()
    assert body["fairness"]["red"] == 0
    assert body["as_written"]["score"] == body["after"]["score"]
    assert any(r["type"] == "contract-clean" for r in body["after"]["reasons"])
