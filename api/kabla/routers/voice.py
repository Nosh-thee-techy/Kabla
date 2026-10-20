"""Karani's voice endpoints. See services/voice.py for why the key lives here."""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from kabla.services import voice

router = APIRouter(tags=["voice"])


class VoiceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=voice.MAX_CHARS)
    lang: str = Field(default="en", pattern="^(en|sw)$")


@router.get("/voice/status")
def status() -> dict:
    """Lets the web app decide between ElevenLabs and the browser's own voice."""
    return {"enabled": voice.enabled(), "provider": "elevenlabs" if voice.enabled() else None}


@router.post("/voice")
def say(body: VoiceRequest) -> Response:
    try:
        audio = voice.speak(body.text, body.lang)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"voice provider error: {exc}") from exc
    if audio is None:
        raise HTTPException(status_code=503, detail="voice not configured (ELEVENLABS_API_KEY missing)")
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400"})
