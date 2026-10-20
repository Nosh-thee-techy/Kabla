"""Before stage: an artist introduces themselves, with consent, and gets a sealed profile.

What this is: self-declared, consent-recorded, hash-sealed. It is NOT verified identity.
What it never does: fetch, scrape or call any social platform. Handles are stored as text the
artist typed. The only facts read from pasted text come from a small, visible reader (below);
MeTTa then lists the gaps (engine/profile.metta). Everything is SYNTHETIC in this demo.
"""
from __future__ import annotations

import json
import re
import unicodedata

from nacl.encoding import HexEncoder
from nacl.signing import VerifyKey

from kabla import store
from kabla.config import get_settings
from kabla.models import ArtistCreate
from kabla.services import samples
from kabla.services.metta_bridge import Sym, fact, query, run_engine
from kabla.services.passport import GENESIS, canonical, ensure_keys, sha256_hex

LABEL = "SYNTHETIC DEMO: self-declared, consent-recorded, hash-sealed. Not verified identity, not legal advice."
CONSENT_TEXT = ("I agree that Kabla records the details I type here, labelled as self-declared, "
                "and that nothing is read from my social accounts.")

PLATFORMS = ("instagram", "facebook", "tiktok", "spotify", "youtube", "soundcloud", "audiomack",
             "boomplay", "x", "twitter", "apple-music")
INCOME_WORDS = {"streaming": "streaming", "live": "live shows", "shows": "live shows", "gig": "live shows",
                "sync": "sync", "merch": "merch", "teaching": "teaching", "commission": "commissions",
                "ads": "ads", "royalt": "royalties"}


class ConsentRequired(ValueError):
    """Raised when the consent tick is missing. Mapped to HTTP 400."""


def _slug(name: str) -> str:
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", plain.lower()).strip("-")
    return slug or "artist"


def _norm_handle(value: str) -> str:
    return value.strip().lstrip("@").lower()


def _clean_handles(raw: dict[str, str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for platform, handle in raw.items():
        key = re.sub(r"[^a-z0-9-]+", "-", platform.strip().lower()).strip("-")
        text = handle.strip()[:80]
        if key and text:
            out[key] = text
    return out


def _fixture_for(handles: dict[str, str]) -> dict | None:
    """A demo artist whose invented handle the visitor typed. No network, just a lookup in data/."""
    typed = {_norm_handle(h) for h in handles.values()}
    for artist in samples.list_artists():
        known = {_norm_handle(h) for h in artist.get("handles", {}).values()}
        if typed & known:
            return artist
    return None


def read_bio(text: str) -> dict:
    """The visible reader: quoted titles, a nearby N%, platform names, income words. Nothing hidden."""
    works: list[dict] = []
    for sentence in re.split(r"(?<=[.!?\n])\s+", text):
        titles = re.findall(r"[\"\u201c]([^\"\u201d]{2,80})[\"\u201d]", sentence)
        share = re.search(r"(\d{1,3})\s*%", sentence)
        for title in titles:
            works.append({"title": title.strip(), "kind": "song",
                          "share": int(share.group(1)) if share else None,
                          "splits_stated": bool(share)})
    seen, unique = set(), []
    for w in works:
        if w["title"].lower() not in seen:
            seen.add(w["title"].lower())
            unique.append(w)
    lowered = text.lower()
    platforms = sorted({p for p in PLATFORMS if re.search(rf"\b{re.escape(p.replace('-', ' '))}\b", lowered)})
    income = sorted({label for word, label in INCOME_WORDS.items() if word in lowered})
    return {"works": unique, "platforms": platforms, "income_streams": income}


def _gaps(artist: str, works: list[dict], handles: dict[str, str], redlines: list[dict]) -> list[dict]:
    facts = [fact(Sym("profile-redline"), Sym(artist), Sym(r["kind"])) for r in redlines]
    facts += [fact(Sym("profile-handle"), Sym(artist), Sym(p)) for p in handles]
    facts += [fact(Sym("profile-work"), Sym(artist), w["title"],
                   Sym("stated" if w.get("splits_stated") else "unstated")) for w in works]
    run = run_engine(facts, [query("gaps", f"(collapse (profile-gaps {artist}))")],
                     extra_files=[get_settings().engine_dir / "profile.metta"])
    rows = run.one("gaps")[0] if run.one("gaps") else []
    return [{"id": str(r[2]), "detail": "" if str(r[3]) == "none" else str(r[3])}
            for r in rows if isinstance(r, list) and len(r) >= 4]


def _redlines_for(artist_id: str, fixture: dict | None) -> list[dict]:
    stored = {r["kind"]: r for r in store.list_redlines(artist_id)}
    for r in (fixture or {}).get("redlines", []):
        stored.setdefault(r["kind"], r)
    return list(stored.values())


def _nft(profile: dict, payload_hash: str) -> dict:
    return {
        "name": f"{profile['name']} - Kabla profile",
        "description": LABEL,
        "image": "ipfs://kabla-placeholder",
        "attributes": [
            {"trait_type": "Platforms listed", "value": len(profile["handles"])},
            {"trait_type": "Works listed", "value": len(profile["facts"]["works"])},
            {"trait_type": "Open gaps", "value": len(profile["gaps"])},
            {"trait_type": "Self-declared", "value": True},
            {"trait_type": "Synthetic", "value": True},
        ],
        "properties": {"certHash": payload_hash, "consent": profile["consent"]["given"]},
        "external_url": "https://example.invalid/kabla",
    }


def _seal(profile: dict) -> dict:
    """Sign the profile and append it to the artist's own hash-linked chain."""
    key = ensure_keys()
    chain = store.seal_chain(profile["id"])
    prev = chain[-1]["record_hash"] if chain else GENESIS
    seq = (chain[-1]["seq"] + 1) if chain else 1
    unsigned = {
        "kabla_version": "1.0", "kind": "profile", "label": LABEL,
        "artist": {"id": profile["id"], "name": profile["name"]},
        "handles": profile["handles"], "facts": profile["facts"],
        "consent": profile["consent"], "source": profile["source"], "prev_hash": prev,
    }
    sig = key.sign(canonical(unsigned).encode("utf-8"))
    certificate = {**unsigned, "signature": {
        "alg": "Ed25519", "pubkey": key.verify_key.encode(HexEncoder).decode("ascii"), "sig": sig.signature.hex()}}
    payload_hash = sha256_hex(canonical(certificate))
    record = {"seq": seq, "artist": profile["id"], "kind": "profile", "payload_hash": payload_hash,
              "prev_hash": prev, "record_hash": sha256_hex(f"{seq}:{payload_hash}:{prev}"),
              "certificate": certificate}
    store.seal_append(profile["id"], record)
    return record


def create_profile(body: ArtistCreate) -> dict:
    if not body.consent:
        raise ConsentRequired("Kabla needs the consent tick before it records anything about you.")
    handles = _clean_handles(body.handles)
    fixture = _fixture_for(handles)
    if fixture:
        artist_id, name, source = fixture["id"], fixture["name"], "synthetic fixture matched by invented handle"
        facts = {"works": fixture.get("works", []), "platforms": sorted(fixture.get("handles", {})),
                 "income_streams": fixture.get("income_streams", [])}
        handles = {**fixture.get("handles", {}), **handles}
    else:
        artist_id, name, source = _slug(body.name), body.name.strip(), "typed by the artist"
        facts = read_bio(body.bio)
    redlines = _redlines_for(artist_id, fixture)
    profile = {
        "id": artist_id, "name": name, "handles": handles, "source": source, "label": LABEL,
        "facts": facts, "lang": body.lang,
        "consent": {"given": True, "at": store.now_iso(), "text": CONSENT_TEXT},
        "bio_chars": len(body.bio), "redlines": [{"kind": r["kind"], "value": r["value"]} for r in redlines],
    }
    profile["gaps"] = _gaps(artist_id, facts["works"], handles, redlines)
    record = _seal(profile)
    profile["seal"] = {"seq": record["seq"], "record_hash": record["record_hash"],
                       "payload_hash": record["payload_hash"]}
    profile["nft"] = _nft(profile, record["payload_hash"])
    store.put_profile(profile)
    return profile


def get_profile(artist_id: str) -> dict | None:
    return store.get_profile(artist_id)


def verify_seals(artist_id: str) -> dict:
    """Recompute every hash and signature in the artist's seal chain."""
    chain = store.seal_chain(artist_id)
    if not chain:
        return {"artist": artist_id, "intact": False, "records": 0, "reason": "no seals for this artist"}
    prev = GENESIS
    for rec in chain:
        cert = rec["certificate"]
        body = {k: v for k, v in cert.items() if k != "signature"}
        try:
            VerifyKey(cert["signature"]["pubkey"], encoder=HexEncoder).verify(
                canonical(body).encode("utf-8"), bytes.fromhex(cert["signature"]["sig"]))
        except Exception:
            return {"artist": artist_id, "intact": False, "records": len(chain), "broken_at": rec["seq"],
                    "reason": "signature does not match"}
        if (rec["prev_hash"] != prev or cert["prev_hash"] != prev
                or rec["payload_hash"] != sha256_hex(canonical(cert))
                or rec["record_hash"] != sha256_hex(f"{rec['seq']}:{rec['payload_hash']}:{prev}")):
            return {"artist": artist_id, "intact": False, "records": len(chain), "broken_at": rec["seq"],
                    "reason": "hash link does not match"}
        prev = rec["record_hash"]
    return {"artist": artist_id, "intact": True, "records": len(chain), "head": prev}


def metadata_json(artist_id: str) -> str | None:
    profile = store.get_profile(artist_id)
    return json.dumps(profile["nft"], ensure_ascii=False, indent=2) if profile else None
