"""Rights Passport: hash, Ed25519 certificate, hash-linked ledger, badges.

The certificate is evidence of agreed terms, not a legal instrument.
"""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import UTC, datetime

from nacl.encoding import HexEncoder
from nacl.exceptions import BadSignatureError
from nacl.signing import SigningKey, VerifyKey

from kabla import store
from kabla.config import get_settings
from kabla.services import samples
from kabla.services.scoring import score as score_of

GENESIS = "0" * 64
ISSUER = "Kabla (demo issuer, not BASIX)"


def _now() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def ensure_keys() -> SigningKey:
    key_dir = get_settings().key_dir
    key_dir.mkdir(parents=True, exist_ok=True)
    path = key_dir / "kabla.ed25519"
    if path.exists():
        return SigningKey(path.read_bytes())
    key = SigningKey.generate()
    path.write_bytes(key.encode())
    (key_dir / "kabla.ed25519.pub").write_text(key.verify_key.encode(HexEncoder).decode("ascii"))
    return key


def sha256_hex(data: bytes | str) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()


def canonical(obj: dict) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def work_bytes(work: dict) -> bytes:
    name = work.get("placeholder_file") or "asali_ya_jioni.PLACEHOLDER.txt"
    return (get_settings().data_dir / "works" / name).read_bytes()


def register(body) -> dict:
    if not body.consent_to_register:
        raise ValueError("Registration needs the artist's explicit consent.")
    work = samples.work(body.work_id)
    digest = sha256_hex(work_bytes(work))
    record = {
        "id": work["id"], "title": work["title"], "artist": work["artist"],
        "sha256": digest, "registered_at": _now(),
        "consent_to_register": True, "consent_to_sell": bool(body.consent_to_sell),
        "collaborators": work.get("collaborators", []), "ai_tools": work.get("ai_tools", ["none"]),
        "owners": work["owners"], "split_confirmations": work.get("split_confirmations", []),
        "consents": work.get("consents", []), "terms": _terms(work),
        "original_location": work.get("original_location", "held by artist"),
        "synthetic": True, "label": "SYNTHETIC DEMO — not a legal instrument",
    }
    store.put_work(record)
    artist = work["artist"]
    _event(artist, "work-registered", work["id"])
    if record["collaborators"]:
        _event(artist, "contributors-listed", work["id"])
    _event(artist, "ai-tools-disclosed", work["id"])
    if any(o["right"] == "composition" for o in work["owners"]):
        shares = [o["share"] for o in work["owners"] if o["right"] == "composition"]
        people = {o["person"] for o in work["owners"] if o["right"] == "composition"}
        confirmed = {c["person"] for c in work.get("split_confirmations", [])}
        if people <= confirmed and abs(sum(shares) - 100) < 0.01:
            _event(artist, "splits-agreed", work["id"])
    if any(r["kind"] == "ai-training" for r in store.list_redlines(artist)):
        _event(artist, "ai-stance-set", artist)
    return record


def _terms(work: dict) -> dict:
    redlines = {r["kind"]: r["value"] for r in store.list_redlines(work["artist"])}
    splits: dict[str, dict[str, float]] = {}
    for o in work["owners"]:
        splits.setdefault(o["right"], {})[o["person"]] = o["share"]
    return {
        "ai_training": redlines.get("ai-training", "opt-in-paid"),
        "territories": ["KE"],
        "term_years": int(redlines.get("term-max-years", work.get("max_licence_months", 12) // 12 or 5)),
        "splits": splits,
        "clause_refs": ["c003-§4", "c003-§6"],
        "voice_likeness": "promo-only",
        "max_licence_months": work.get("max_licence_months", 12),
        "ai_ref": "c003-§6", "voice_ref": "c003-§7", "term_ref": "work-policy",
    }


def _event(artist: str, type_: str, subject: str) -> None:
    if not store.has_event(artist, type_, subject):
        store.add_event(artist, type_, subject)


def issue(artist: str, work_id: str = "w-asali") -> dict:
    work = store.get_work(work_id)
    if not work:
        raise ValueError("Register the work (with consent) before issuing a passport.")
    key = ensure_keys()
    prev = GENESIS
    seq = 1
    chain = store.ledger_all()
    if chain:
        prev = chain[-1]["record_hash"]
        seq = chain[-1]["seq"] + 1
    unsigned = {
        "kabla_version": "1.0",
        "label": "SYNTHETIC DEMO — not a legal instrument",
        "work": {"id": work["id"], "title": work["title"], "sha256": work["sha256"],
                 "registered_at": work["registered_at"]},
        "artist": {"id": artist, "name": samples.artist_name(artist),
                   "consent_to_register": True, "consent_to_sell": work.get("consent_to_sell", False)},
        "creation": {"collaborators": work.get("collaborators", []),
                     "ai_tools": work.get("ai_tools", ["none"]),
                     "original_location": work.get("original_location", "held by artist")},
        "terms": {k: work["terms"][k] for k in ("ai_training", "territories", "term_years", "splits", "clause_refs")
                  if k in work["terms"]},
        "prev_hash": prev,
    }
    sig = key.sign(canonical(unsigned).encode("utf-8"))
    certificate = {**unsigned, "signature": {
        "alg": "Ed25519",
        "pubkey": key.verify_key.encode(HexEncoder).decode("ascii"),
        "sig": sig.signature.hex(),
    }}
    payload_hash = sha256_hex(canonical(certificate))
    record_hash = sha256_hex(f"{seq}:{payload_hash}:{prev}")
    record = {"seq": seq, "artist": artist, "kind": "certificate", "work_id": work["id"],
              "payload_hash": payload_hash, "prev_hash": prev, "record_hash": record_hash,
              "certificate": certificate, "nft": _erc721(certificate)}
    store.ledger_append(artist, record)
    work["certificate_seq"] = seq
    store.put_work(work)
    badges = issue_badges(artist)
    return {"certificate": certificate, "ledger_record": record, "badges": badges,
            "score": score_of(artist), "nft": record["nft"]}


def _erc721(cert: dict) -> dict:
    attrs = [{"trait_type": k, "value": str(v)} for k, v in (
        ("AI training", cert["terms"].get("ai_training")),
        ("Term (years)", cert["terms"].get("term_years")),
        ("Synthetic", True),
    )]
    return {
        "name": f"{cert['work']['title']} — Rights Passport",
        "description": "SYNTHETIC DEMO certificate. Hash-linked evidence of agreed terms, not a legal instrument.",
        "image": "ipfs://kabla-placeholder",
        "attributes": attrs,
        "properties": {"rights": cert["terms"], "sha256": cert["work"]["sha256"]},
        "external_url": "https://example.invalid/kabla",
    }


BADGE_CLASSES = [
    ("read-before-signing", "Read Before Signing", "contract-analysed", "Contract analysed with a MeTTa trail."),
    ("ai-training-locked", "AI-Training Locked", "ai-stance-set", "AI-training stance set to never or opt-in."),
    ("splits-agreed", "Splits Agreed", "splits-agreed", "Every co-writer confirmed; shares total 100%."),
    ("clean-deal", "Clean Deal", "contract-clean", "No unresolved red flags after analysis."),
    ("fully-cleared", "Fully Cleared", "licence-cleared", "A licence was granted with all required consents."),
]


def issue_badges(artist: str) -> list[dict]:
    have = {e["type"]: e for e in store.list_events(artist)}
    out = []
    for slug, name, event_type, desc in BADGE_CLASSES:
        event = have.get(event_type)
        if not event:
            continue
        assertion = {
            "@context": "https://w3id.org/openbadges/v2",
            "type": "Assertion",
            "id": f"urn:uuid:kabla-{artist}-{slug}",
            "badge": {
                "type": "BadgeClass",
                "id": f"urn:uuid:kabla-class-{slug}",
                "name": name,
                "description": desc,
                "issuer": {"type": "Issuer", "name": ISSUER, "url": "https://example.invalid/kabla"},
                "criteria": {"narrative": f"Verified event `{event_type}` in the artist's log."},
            },
            "issuedOn": event["date"],
            "recipient": {"type": "email", "hashed": False, "identity": f"{artist}@synthetic.kabla"},
            "verification": {"type": "hosted"},
            "evidence": [{"id": event["id"], "narrative": event_type}],
            "expires": None,
            "_note": "Demo assertion. Issuer is Kabla, not BASIX.",
        }
        out.append(assertion)
    return out


def passport(artist: str) -> dict:
    certs = [r for r in store.ledger_all() if r.get("artist") == artist]
    return {
        "artist": artist, "synthetic": True, "label": "rights-health, not credit",
        "certificates": [r["certificate"] for r in certs],
        "ledger": certs, "badges": issue_badges(artist), "score": score_of(artist),
    }


def verify(certificate: dict | None, ledger: list[dict] | None, work_file: bytes | None = None) -> dict:
    chain = ledger if ledger is not None else store.ledger_all()
    if certificate and not ledger:
        chain = [r for r in chain if r.get("certificate") and
                 r["certificate"].get("work", {}).get("sha256") == certificate.get("work", {}).get("sha256")]
        if certificate:
            # verify this cert in place of the stored one
            chain = deepcopy(chain) or [{"seq": 1, "prev_hash": certificate.get("prev_hash", GENESIS),
                                         "certificate": certificate, "payload_hash": "", "record_hash": ""}]
            if chain and chain[-1].get("certificate"):
                chain[-1]["certificate"] = certificate
                chain[-1]["payload_hash"] = sha256_hex(canonical(certificate))
                chain[-1]["record_hash"] = sha256_hex(
                    f"{chain[-1]['seq']}:{chain[-1]['payload_hash']}:{chain[-1]['prev_hash']}")
    if not chain:
        return {"intact": False, "reason": "no ledger records"}
    prev = GENESIS
    for rec in chain:
        expected = sha256_hex(f"{rec['seq']}:{rec['payload_hash']}:{rec['prev_hash']}")
        if rec["prev_hash"] != prev:
            return {"intact": False, "broken_seq": rec["seq"],
                    "reason": f"tampered: record {rec['seq']} hash mismatch (prev_hash)"}
        if rec["record_hash"] != expected:
            return {"intact": False, "broken_seq": rec["seq"],
                    "reason": f"tampered: record {rec['seq']} hash mismatch"}
        cert = rec.get("certificate") or {}
        if cert:
            sig = cert.get("signature") or {}
            unsigned = {k: v for k, v in cert.items() if k != "signature"}
            try:
                VerifyKey(sig["pubkey"], encoder=HexEncoder).verify(
                    canonical(unsigned).encode("utf-8"), bytes.fromhex(sig["sig"]))
            except (BadSignatureError, KeyError, ValueError):
                return {"intact": False, "broken_seq": rec["seq"],
                        "reason": f"tampered: record {rec['seq']} signature mismatch"}
            if work_file is not None:
                digest = sha256_hex(work_file)
                if digest != cert.get("work", {}).get("sha256"):
                    return {"intact": False, "broken_seq": rec["seq"],
                            "reason": "work file hash does not match the certificate"}
        prev = rec["record_hash"]
    return {"intact": True, "records": len(chain), "reason": "intact"}


def tamper(certificate: dict) -> dict:
    """Demo helper: change one character of the title so verification must fail."""
    out = deepcopy(certificate)
    title = out["work"]["title"]
    out["work"]["title"] = title[:-1] + ("!" if not title.endswith("!") else "?")
    return out
