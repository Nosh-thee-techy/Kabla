"""FastAPI app: CORS, health, router mount."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from kabla import __version__
from kabla.config import get_settings
from kabla.routers import analyze, artists, chat, contracts, licence, negotiate, omega, passport, voice
from kabla.services.extractor import ExtractionUnavailable

app = FastAPI(title="Kabla API", version=__version__,
              description="SYNTHETIC DEMO. MeTTa rules on PeTTa decide; the LLM (live mode only) only reads.")

@app.exception_handler(ExtractionUnavailable)
async def _extraction_unavailable(_req: Request, exc: ExtractionUnavailable) -> JSONResponse:
    """One place that turns "cannot read this text" into a clear 422 for every route that analyses."""
    return JSONResponse(status_code=422, content={"detail": str(exc)})


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
app.include_router(chat.router)
app.include_router(voice.router)
app.include_router(artists.router)
app.include_router(omega.router)


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
