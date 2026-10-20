"""Voice is optional and never touches the network in tests."""
from fastapi.testclient import TestClient

from kabla.main import app
from kabla.services import voice


def test_voice_disabled_without_key(monkeypatch):
    monkeypatch.delenv("ELEVENLABS_API_KEY", raising=False)
    client = TestClient(app)
    assert client.get("/voice/status").json()["enabled"] is False
    assert client.post("/voice", json={"text": "Start here.", "lang": "en"}).status_code == 503


def test_voice_caches_by_text(monkeypatch, tmp_path):
    """Second call for the same line must not hit the provider again."""
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-key-not-real")
    monkeypatch.setattr(voice, "cache_dir", lambda: tmp_path)
    calls = []

    class FakeResponse:
        content = b"ID3fake-mp3"

        def raise_for_status(self):
            return None

    def fake_post(url, **kwargs):
        calls.append((url, kwargs["json"]["text"]))
        return FakeResponse()

    monkeypatch.setattr(voice.httpx, "post", fake_post)
    client = TestClient(app)
    first = client.post("/voice", json={"text": "Raise the curtain.", "lang": "en"})
    second = client.post("/voice", json={"text": "Raise the curtain.", "lang": "en"})
    assert first.status_code == 200 and first.headers["content-type"].startswith("audio/mpeg")
    assert first.content == second.content == b"ID3fake-mp3"
    assert len(calls) == 1
    assert "api.elevenlabs.io" in calls[0][0]


def test_voice_rejects_long_text(monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-key-not-real")
    res = TestClient(app).post("/voice", json={"text": "x" * (voice.MAX_CHARS + 1), "lang": "en"})
    assert res.status_code == 422
