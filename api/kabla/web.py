"""Production entry point: the built web app and the API on one origin.

Run with `uvicorn kabla.web:app`. Why a separate module instead of changing kabla.main: tests and local dev talk
to the API at the root (the Vite dev server proxies /api and strips the prefix), so `kabla.main:app` keeps its
routes where they are. Here the same app is mounted under /api (what the built UI calls, VITE_API_URL=/api) and
the static UI is served for everything else, with index.html as the fallback so a reload on /map or /passport
works. If web/dist does not exist the API alone is served, so this never breaks a local run.
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.staticfiles import StaticFiles

from kabla.config import REPO
from kabla.main import app as api

DIST = REPO / "web" / "dist"


class SPAFiles(StaticFiles):
    """Static files that answer unknown paths with index.html (client-side routes), but keep real 404s for assets."""

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404 and "." not in Path(path).name:
                return await super().get_response("index.html", scope)
            raise


app = FastAPI(title="Kabla (web + API)", docs_url=None, redoc_url=None, openapi_url=None)
if DIST.is_dir():
    app.mount("/api", api)
    app.mount("/", SPAFiles(directory=str(DIST), html=True), name="web")
else:
    app = api  # no built UI: serve the plain API
