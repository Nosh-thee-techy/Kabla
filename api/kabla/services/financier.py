"""Read-only backer view of an artist's existing passport facts.

Why this module exists: a financier should see ownership, open flags, AI
stance and consent gaps without a new score or new rules. Every field is
copied from work JSON, analyze(), licence.check() and score().
"""
from __future__ import annotations

from kabla import store
from kabla.models import LicenceRequest
from kabla.services import samples
from kabla.services.analyze import analyze
from kabla.services.licence import check
from kabla.services.scoring import score as score_of

# Plain "risk to a backer" lines for flags the engine already emits.
# Not weights. Not a second scoring model.
BACKER_RISK = {
    "R-GRANT-01": "Perpetual exclusive grant: the artist cannot take the work elsewhere.",
    "R-GRANT-02": "Perpetual grant (non-exclusive): the work may stay tied up without an end date.",
    "R-TERM-01": "Term longer than the artist's standing cap: the deal outlives the red line.",
    "R-AI-01": "AI training granted without opt-in: recordings may train models with no extra pay.",
    "R-AI-02": "Vague new-technology wording: AI use may be read in later without a clear ask.",
    "R-VOICE-01": "Synthetic voice or likeness rights: a model of the artist could be built.",
    "R-REVERT-01": "No reversion: unused rights may never return to the artist.",
    "R-XCOLL-01": "Cross-collateralisation: recoupment on one deal can eat another.",
    "R-OPT-01": "Label-only options: the artist cannot refuse further periods.",
    "R-ROY-01": "Royalty below the illustrative floor: the artist's share is thin.",
    "R-AUDIT-01": "No audit right: the artist cannot check the reported numbers.",
    "R-SYNC-01": "Sync without artist approval: the work can be placed in film or ads unseen.",
    "R-SPLIT-01": "Splits missing or not 100%: a later licence may stall on an unnamed share.",
}

BANNER = (
    "Rights evidence for demonstration. Not a credit score, not lending advice. "
    "SYNTHETIC DATA."
)

# Existing demo licence questions (same bodies as the Licence Desk presets).
# Used only to name people who have not consented — not to invent new uses.
_LICENCE_PROBES = (
    {"use": "ad", "territory": "KE", "months": 6, "party": "Nuru Soaps"},
    {"use": "ai-training", "territory": "WW", "months": 12, "party": "Nuru Labs"},
    {"use": "sync-film", "territory": "US", "months": 3, "party": "Exhibition (SYNTHETIC)"},
)


def financier(artist: str, work_id: str = "w-asali") -> dict:
    """Assemble a backer-facing sheet from data Kabla already stores."""
    work = store.get_work(work_id) or samples.work(work_id)
    confirmed = {c["person"] for c in work.get("split_confirmations", [])}
    owners = [
        {
            "right": o["right"],
            "person": o["person"],
            "name": samples.artist_name(o["person"]),
            "share": o["share"],
            "confirmed": o["person"] in confirmed,
        }
        for o in work.get("owners", [])
    ]
    flags = _open_flags(artist)
    redlines = store.list_redlines(artist)
    ai = next((r for r in redlines if r["kind"] == "ai-training"), None)
    return {
        "artist": artist,
        "work_id": work.get("id", work_id),
        "work_title": work.get("title", work_id),
        "banner": BANNER,
        "label": "rights-health, not credit",
        "synthetic": True,
        "owners": owners,
        "flags": flags,
        "ai_stance": {
            "kind": "ai-training",
            "value": ai["value"] if ai else None,
            "set_on": ai.get("set_on") if ai else None,
            "said": ai.get("said") if ai else None,
        },
        "consent_gaps": _consent_gaps(work_id, owners),
        "score": score_of(artist),
    }


def _open_flags(artist: str) -> list[dict]:
    """Reuse analyze() on stored contracts so flags stay the same as the clause map."""
    out: list[dict] = []
    seen: set[tuple] = set()
    for contract in store.list_contracts():
        if contract.get("artist") != artist:
            continue
        analysis = analyze(contract)
        for f in analysis.flags:
            key = (contract["id"], f.rule_id, f.clause)
            if key in seen:
                continue
            seen.add(key)
            out.append({
                "contract_id": contract["id"],
                "rule_id": f.rule_id,
                "severity": f.severity,
                "clause": f.clause,
                "topic": f.topic,
                "title_en": f.title_en,
                "title_sw": f.title_sw,
                "risk": BACKER_RISK.get(f.rule_id, f.meaning_en),
                "redline_set_on": f.redline_set_on,
            })
    return out


def _consent_gaps(work_id: str, owners: list[dict]) -> list[dict]:
    """Name people who have not confirmed a share or who licence.check already lists as missing."""
    gaps: dict[str, dict] = {}
    for o in owners:
        if not o["confirmed"]:
            gaps[o["person"]] = {
                "person": o["person"],
                "name": o["name"],
                "right": o["right"],
                "share": o["share"],
                "why": "Has not confirmed their share.",
            }
    for probe in _LICENCE_PROBES:
        verdict = check(LicenceRequest(work_id=work_id, **probe), f"fin-{probe['use']}")
        for missing in verdict.missing:
            person = missing.person
            gaps.setdefault(person, {
                "person": person,
                "name": missing.name,
                "right": missing.right,
                "share": missing.share,
                "why": f"Needs consent for {probe['use']} in {probe['territory']}.",
            })
    return list(gaps.values())
