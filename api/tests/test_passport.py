from fastapi.testclient import TestClient

from kabla.main import app
from kabla.services.passport import tamper


def test_register_requires_consent(fresh_store):
    r = TestClient(app).post("/works", json={"work_id": "w-asali", "consent_to_register": False})
    assert r.status_code == 400


def test_issue_verify_tamper_and_score(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c003"})
    client.post("/contracts/c003/analyze")
    reg = client.post("/works", json={"work_id": "w-asali", "consent_to_register": True,
                                      "consent_to_sell": False}).json()
    assert reg["consent_to_sell"] is False
    assert len(reg["sha256"]) == 64

    issued = client.post("/passport/zawadi/issue").json()
    cert = issued["certificate"]
    assert cert["label"].startswith("SYNTHETIC")
    assert cert["signature"]["alg"] == "Ed25519"
    assert issued["score"]["label"] == "rights-health, not credit"
    assert issued["score"]["score"] == 65
    assert sum(r["points"] for r in issued["score"]["reasons"]) == 65
    names = {b["badge"]["name"] for b in issued["badges"]}
    assert "AI-Training Locked" in names and "Splits Agreed" in names and "Read Before Signing" in names
    assert all(b["badge"]["issuer"]["name"].startswith("Kabla") for b in issued["badges"])

    stored = client.get("/passport/zawadi").json()
    intact = client.post("/verify", json={"ledger": stored["ledger"]}).json()
    assert intact["intact"] is True

    mutated = tamper(cert)
    broken = client.post("/verify", json={"certificate": mutated}).json()
    assert broken["intact"] is False
    assert "tampered" in broken["reason"]

    demo = client.post("/verify/tamper-demo", json={"certificate": cert}).json()
    assert demo["intact"] is False
