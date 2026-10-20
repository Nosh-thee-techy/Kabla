"""The Omega chat bridge: never blocks, shows 'down' when the agent is silent, delivers each message once."""
from __future__ import annotations

import json
import os
import time

from fastapi.testclient import TestClient

from kabla.main import app
from kabla.routers import omega

client = TestClient(app)


def test_post_writes_inbox_and_reports_agent_down(tmp_path, monkeypatch):
    monkeypatch.setattr(omega, "_DIR", tmp_path)
    r = client.post("/omega/chat", json={"text": "analyse c001"})
    assert r.status_code == 200
    saved = json.loads((tmp_path / "inbox.json").read_text(encoding="utf-8"))
    assert saved["text"] == "analyse c001" and saved["id"] == r.json()["id"]
    assert r.json()["agent"] == "down"  # no heartbeat yet: the page must say so, not hang


def test_replies_and_heartbeat(tmp_path, monkeypatch):
    monkeypatch.setattr(omega, "_DIR", tmp_path)
    (tmp_path / "outbox.jsonl").write_text(
        json.dumps({"ts": 1, "text": "hello"}) + "\n{half-written", encoding="utf-8")
    (tmp_path / "heartbeat").write_text("x", encoding="utf-8")
    body = client.get("/omega/chat").json()
    assert body["replies"] == [{"ts": 1, "text": "hello"}]  # a torn line is skipped, not an error
    assert body["agent"] == "up"
    old = time.time() - 600
    os.utime(tmp_path / "heartbeat", (old, old))
    assert client.get("/omega/chat").json()["agent"] == "down"  # stale heartbeat = down


def test_empty_message_rejected(tmp_path, monkeypatch):
    monkeypatch.setattr(omega, "_DIR", tmp_path)
    assert client.post("/omega/chat", json={"text": ""}).status_code == 422
