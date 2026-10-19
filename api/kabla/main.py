"""FastAPI app: CORS, health, router mount."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from kabla import __version__
from kabla.config import get_settings
from kabla.routers import analyze, contracts, licence, negotiate, passport

app = FastAPI(title="Kabla API", version=__version__,
              description="SYNTHETIC DEMO. MeTTa rules on PeTTa decide; the LLM (live mode only) only reads.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contracts.router)
app.include_router(analyze.router)
app.include_router(licence.router)
app.include_router(negotiate.router)
app.include_router(passport.router)


@app.get("/health")
def health() -> dict:
    s = get_settings()
    return {
        "status": "ok",
        "mode": s.mode,
        "engine": "MeTTa on PeTTa",
        "engine_version": _petta_commit(s.petta_home),
        "kabla_version": __version__,
        "synthetic": True,
    }


def _petta_commit(home) -> str:
    head = home / ".git" / "HEAD"
    try:
        return head.read_text(encoding="utf-8").strip()[:12]
    except OSError:
        return "missing"
