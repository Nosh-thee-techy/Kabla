from fastapi.testclient import TestClient

from kabla.main import app


def test_health_reports_mode_and_engine():
    body = TestClient(app).get("/health").json()
    assert body["status"] == "ok"
    assert body["mode"] in ("deterministic", "live")
    assert body["engine"] == "MeTTa on PeTTa"
    assert body["synthetic"] is True
