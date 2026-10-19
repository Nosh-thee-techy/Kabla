"""`python -m kabla.cli init|reset` — create the store and seed synthetic data."""
from __future__ import annotations

import json
import sys

from kabla import store
from kabla.config import get_settings


def seed() -> None:
    """Load the synthetic artists' red lines (source: artist profile) into the store."""
    artists = get_settings().data_dir / "artists"
    for path in sorted(artists.glob("*.json")):
        artist = json.loads(path.read_text(encoding="utf-8"))
        for r in artist.get("redlines", []):
            if not any(x["kind"] == r["kind"] for x in store.list_redlines(artist["id"])):
                store.set_redline(artist["id"], r["kind"], {**r, "artist": artist["id"], "source": "artist-profile"})


def main(argv: list[str]) -> None:
    cmd = argv[1] if len(argv) > 1 else "init"
    if cmd == "reset":
        store.reset()
    seed()
    print(f"kabla store ready at {get_settings().db_path}")


if __name__ == "__main__":
    main(sys.argv)
