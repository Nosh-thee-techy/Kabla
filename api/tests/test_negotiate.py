from fastapi.testclient import TestClient

from kabla.main import app


def _start(client: TestClient) -> dict:
    client.post("/contracts", json={"sample_id": "c001"})
    return client.post("/contracts/c001/negotiate/start").json()


def _decide(client: TestClient, sid: str, mapping: dict[str, str]) -> dict:
    body = {"decisions": [{"topic": t, "decision": d} for t, d in mapping.items()]}
    return client.post(f"/negotiations/{sid}/decide", json=body).json()


def _open_map(session: dict) -> dict[str, str]:
    return {t["topic"]: "approve" for t in session["topics"] if t["status"] == "open"}


def test_start_opens_flagged_topics_in_priority(fresh_store):
    body = _start(TestClient(app))
    assert body["state"] == "open" and body["round"] == 1
    topics = [t["topic"] for t in body["topics"]]
    assert topics[0] == "ai-training" and topics[1] == "voice-likeness"
    ai = next(t for t in body["topics"] if t["topic"] == "ai-training")
    assert ai["kind"] == "counter" and ai["offered"] == "opt-in-paid"
    assert ai["advice"] == "hold-redline" and ai["is_redline"] is True


def test_agreed_when_artist_approves_every_move(fresh_store):
    client = TestClient(app)
    session = _start(client)
    sid = session["id"]
    for _ in range(4):
        session = _decide(client, sid, _open_map(session))
        if session["state"] != "open":
            break
    assert session["state"] == "agreed"
    assert session["unresolved"] == []


def test_walk_away_when_redline_rejected_at_floor(fresh_store):
    client = TestClient(app)
    session = _start(client)
    sid = session["id"]
    # round 1: take the AI step onto the floor, approve everything else
    session = _decide(client, sid, _open_map(session))
    mapping = _open_map(session)
    mapping["ai-training"] = "reject"
    session = _decide(client, sid, mapping)
    assert session["state"] == "walk-away"
    assert "ai-training" in session["unresolved"]


def test_standoff_when_one_non_redline_is_held(fresh_store):
    client = TestClient(app)
    session = _start(client)
    sid = session["id"]
    for _ in range(4):
        mapping = _open_map(session)
        mapping["option-periods"] = "reject"
        session = _decide(client, sid, mapping)
        if session["state"] != "open":
            break
    assert session["state"] == "standoff"
    assert "option-periods" in session["unresolved"]
    ledger = client.get(f"/negotiations/{sid}/ledger").json()
    assert ledger["ledger"]
    md = client.get(f"/negotiations/{sid}/transcript.md").text
    assert "SYNTHETIC" in md and "option-periods" in md
