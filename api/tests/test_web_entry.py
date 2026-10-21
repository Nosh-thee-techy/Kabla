"""kabla.web serves the built UI and the API on one origin (the public host runs this)."""
import pytest
from fastapi.testclient import TestClient

from kabla.web import DIST, app

pytestmark = pytest.mark.skipif(not DIST.is_dir(), reason="web/dist not built (run npm run build in web/)")


def test_ui_routes_fall_back_to_index_but_missing_assets_are_404():
    c = TestClient(app)
    assert c.get("/").status_code == 200
    page = c.get("/passport")  # a client-side route: a reload on it must still load the app
    assert page.status_code == 200 and "text/html" in page.headers["content-type"]
    assert c.get("/assets/does-not-exist.js").status_code == 404


def test_api_is_under_the_prefix():
    c = TestClient(app)
    assert c.get("/api/health").json()["synthetic"] is True
    assert c.get("/api/samples").status_code == 200
