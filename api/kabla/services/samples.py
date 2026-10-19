"""Synthetic sample contracts, artists and works shipped in data/."""
from __future__ import annotations

import json
import re
from functools import lru_cache

from kabla.config import get_settings

SAMPLE_FILES = {
    "c001": "c001_mawingu_records.txt",
    "c002": "c002_pwani_publishing.txt",
    "c003": "c003_kilele_collective.txt",
}

SAMPLE_BLURBS = {
    "c001": "Exclusive recording deal. Read it carefully.",
    "c002": "Publishing deal. Some fair terms, some traps.",
    "c003": "Distribution licence. Mostly fair, for contrast.",
}


def _data():
    return get_settings().data_dir


def contract_text(sample_id: str) -> str:
    return (_data() / "contracts" / SAMPLE_FILES[sample_id]).read_text(encoding="utf-8")


def fixture(sample_id: str) -> dict:
    return json.loads((_data() / "extractions" / f"{sample_id}.json").read_text(encoding="utf-8"))


def contract_title(text: str) -> str:
    for line in text.splitlines()[1:]:
        if line.strip():
            return line.strip().title()
    return "Contract"


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def match_sample(text: str) -> str | None:
    """If pasted text is one of the samples (whitespace-insensitive), return its id."""
    wanted = _norm(text)
    for sid in SAMPLE_FILES:
        if _norm(contract_text(sid)) == wanted:
            return sid
    return None


def list_samples() -> list[dict]:
    out = []
    for sid in SAMPLE_FILES:
        fx = fixture(sid)
        text = contract_text(sid)
        out.append({"id": sid, "title": contract_title(text), "label": fx["parties"]["label"],
                    "kind": fx["kind"], "artist": fx["artist"], "blurb": SAMPLE_BLURBS[sid], "synthetic": True})
    return out


@lru_cache
def artist(artist_id: str) -> dict:
    path = _data() / "artists" / f"{artist_id}.json"
    if not path.exists():
        return {"id": artist_id, "name": artist_id.title(), "redlines": []}
    return json.loads(path.read_text(encoding="utf-8"))


def artist_name(artist_id: str) -> str:
    return artist(artist_id)["name"]


def list_artists() -> list[dict]:
    return [json.loads(p.read_text(encoding="utf-8")) for p in sorted((_data() / "artists").glob("*.json"))]


def work(work_id: str) -> dict:
    path = _data() / "works" / f"{work_id.replace('-', '_')}.json"
    return json.loads(path.read_text(encoding="utf-8"))
