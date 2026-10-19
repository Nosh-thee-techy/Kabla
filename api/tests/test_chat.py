from fastapi.testclient import TestClient

from kabla.main import app


def test_chat_grounds_why_in_trail(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c001"})
    body = client.post(
        "/chat",
        json={"question": "why is AI training flagged?", "contract_id": "c001", "lang": "en"},
    ).json()
    assert body["grounded"] is True
    assert any(rid.startswith("R-AI") for rid in body["rule_ids"])
    assert body["trail"]


def test_chat_swahili(fresh_store):
    client = TestClient(app)
    client.post("/contracts", json={"sample_id": "c001"})
    body = client.post("/chat", json={"question": "AI", "contract_id": "c001", "lang": "sw"}).json()
    assert body["grounded"] is True
    assert "kifungu" in body["answer"].lower()
