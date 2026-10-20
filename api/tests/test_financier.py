from fastapi.testclient import TestClient

from kabla.main import app


def test_financier_view_for_c001(fresh_store):
    """c001 flags + w-asali owners, no new score — only rearranged existing facts."""
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c001"})
    client.post("/contracts/c001/analyze")
    body = client.get("/passport/zawadi/financier").json()
    assert body["banner"].startswith("Rights evidence for demonstration")
    assert "Not a credit score" in body["banner"]
    assert "SYNTHETIC" in body["banner"]
    assert body["label"] == "rights-health, not credit"
    assert body["score"]["label"] == "rights-health, not credit"
    masters = [o for o in body["owners"] if o["right"] == "master"]
    assert masters == [{"right": "master", "person": "zawadi", "name": "Zawadi",
                        "share": 100, "confirmed": True}]
    assert any(o["person"] == "baraka" and o["share"] == 40 and o["confirmed"]
               for o in body["owners"] if o["right"] == "composition")
    rules = {f["rule_id"] for f in body["flags"]}
    assert {"R-GRANT-01", "R-AI-01", "R-XCOLL-01"} <= rules
    grant = next(f for f in body["flags"] if f["rule_id"] == "R-GRANT-01")
    assert grant["clause"] == 4
    assert "Perpetual" in grant["risk"]
    assert body["ai_stance"]["value"] == "never"
    assert body["ai_stance"]["set_on"] == "2026-10-19"
    assert any(g["person"] == "baraka" for g in body["consent_gaps"])
