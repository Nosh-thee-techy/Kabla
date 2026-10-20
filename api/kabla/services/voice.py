"""Karani's voice: short guidance lines -> mp3 through ElevenLabs.

Why this module exists: the browser must never hold the ElevenLabs key, so the
web app asks this API to speak and the API talks to ElevenLabs. Each line is
cached on disk under var/voice/ by content hash, so a demo run through all the
rooms costs one request per distinct line, not one per page view.

Voice is optional. With no ELEVENLABS_API_KEY the API reports disabled and the
web app falls back to the browser's own speech synthesis. Nothing here decides
anything about a contract; it only reads Karani's lines aloud.
"""
from __future__ import annotations

import hashlib
import os
from pathlib import Path

import httpx

from kabla.config import get_settings

# Bound cost and abuse: Karani's lines are one or two sentences.
MAX_CHARS = 400
# A public premade ElevenLabs voice id; override with ELEVENLABS_VOICE_ID.
DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"
# Multilingual model so the Swahili lines are pronounced, not spelled out.
DEFAULT_MODEL = "eleven_multilingual_v2"
ENDPOINT = "https://api.elevenlabs.io/v1/text-to-speech/{voice}"


def enabled() -> bool:
    """True when a key is configured. get_settings() loads .env first."""
    get_settings()
    return bool(os.environ.get("ELEVENLABS_API_KEY"))


def cache_dir() -> Path:
    """Audio sits next to the SQLite file (var/ is git-ignored)."""
    d = get_settings().db_path.parent / "voice"
    d.mkdir(parents=True, exist_ok=True)
    return d


def cache_path(text: str, lang: str, voice: str, model: str) -> Path:
    digest = hashlib.sha256(f"{voice}|{model}|{lang}|{text}".encode("utf-8")).hexdigest()[:24]
    return cache_dir() / f"{digest}.mp3"


def speak(text: str, lang: str = "en") -> bytes | None:
    """Return mp3 bytes for `text`, or None when voice is not configured.

    Raises httpx.HTTPStatusError when ElevenLabs rejects the request, so the
    router can turn it into a clean 502 instead of a silent failure.
    """
    get_settings()
    key = os.environ.get("ELEVENLABS_API_KEY")
    if not key:
        return None
    text = text.strip()[:MAX_CHARS]
    if not text:
        return b""
    voice = os.environ.get("ELEVENLABS_VOICE_ID", DEFAULT_VOICE)
    model = os.environ.get("ELEVENLABS_MODEL", DEFAULT_MODEL)
    path = cache_path(text, lang, voice, model)
    if path.exists():
        return path.read_bytes()
    res = httpx.post(
        ENDPOINT.format(voice=voice),
        headers={"xi-api-key": key, "accept": "audio/mpeg", "content-type": "application/json"},
        json={
            "text": text,
            "model_id": model,
            # Calm, steady clerk: low style, high stability.
            "voice_settings": {"stability": 0.6, "similarity_boost": 0.8, "style": 0.1},
        },
        timeout=30,
    )
    res.raise_for_status()
    path.write_bytes(res.content)
    return res.content
