"""Pre-sign surfaces: sign-readiness preview, fairness meter, checklist.

MeTTa still decides the score. This module only assembles hypothetical
events (unresolved reds vs clean deal) and summarises flags that already exist.
"""
from __future__ import annotations

from kabla import store
from kabla.services import samples
from kabla.services.analyze import analyze
from kabla.services.scoring import merge_hypothetical, score_from_events

TOPICS = [
    "grant", "term", "ai-training", "voice-likeness", "reversion",
    "cross-collateral", "option-periods", "royalty", "audit", "sync-approval", "splits",
]


def readiness(contract: dict, work_id: str = "w-asali") -> dict:
    analysis = analyze(contract)
    artist = contract["artist"]
    nego = store.latest_negotiation(contract["id"])
    reds = [f for f in analysis.flags if f.severity == "red"]
    remaining = _remaining_reds(reds, nego)

    standing = _standing_events(artist, work_id)
    as_written_extra = standing + [
        {"id": f"hyp-red-{f.rule_id}", "type": "unresolved-red-signed",
         "subject": f.rule_id, "date": "2026-10-19"}
        for f in reds
    ]
    if not reds:
        as_written_extra.append({"id": "hyp-clean-now", "type": "contract-clean",
                                 "subject": contract["id"], "date": "2026-10-19"})
    after_extra = standing + [
        {"id": f"hyp-red-{f.rule_id}", "type": "unresolved-red-signed",
         "subject": f.rule_id, "date": "2026-10-19"}
        for f in remaining
    ]
    if not remaining:
        after_extra.append({"id": "hyp-clean", "type": "contract-clean",
                            "subject": contract["id"], "date": "2026-10-19"})

    as_written = score_from_events(artist, merge_hypothetical(artist, as_written_extra))
    after = score_from_events(artist, merge_hypothetical(artist, after_extra))
    return {
        "contract_id": contract["id"],
        "artist": artist,
        "label": "rights-health, not credit",
        "as_written": as_written,
        "after": after,
        "fairness": _fairness(analysis),
        "checklist": checklist(artist, work_id),
        "remaining_reds": [f.rule_id for f in remaining],
        "projected": nego is None,
        "synthetic": True,
    }


def _remaining_reds(reds, nego) -> list:
    if not nego:
        return []
    if nego.get("state") == "agreed":
        return []
    open_topics = {t["topic"] for t in nego.get("topics", []) if t.get("status") == "open"}
    return [f for f in reds if f.topic in open_topics]


def _standing_events(artist: str, work_id: str) -> list[dict]:
    """Facts that are already true in the demo data, not yet ledger events."""
    extras: list[dict] = []
    if any(r["kind"] == "ai-training" for r in store.list_redlines(artist)):
        extras.append({"id": "hyp-ai-stance", "type": "ai-stance-set", "subject": artist})
    try:
        work = samples.work(work_id)
    except Exception:
        return extras
    if work.get("collaborators"):
        extras.append({"id": "hyp-contrib", "type": "contributors-listed", "subject": work["id"]})
    if work.get("ai_tools"):
        extras.append({"id": "hyp-ai-tools", "type": "ai-tools-disclosed", "subject": work["id"]})
    if _splits_ok(work):
        extras.append({"id": "hyp-splits", "type": "splits-agreed", "subject": work["id"]})
    return extras


def _splits_ok(work: dict) -> bool:
    shares = [o["share"] for o in work.get("owners", []) if o["right"] == "composition"]
    people = {o["person"] for o in work.get("owners", []) if o["right"] == "composition"}
    confirmed = {c["person"] for c in work.get("split_confirmations", [])}
    return bool(shares) and people <= confirmed and abs(sum(shares) - 100) < 0.01


def _fairness(analysis) -> dict:
    flagged = {f.topic for f in analysis.flags}
    fair = [t for t in TOPICS if t not in flagged]
    red = analysis.summary["red"]
    amber = analysis.summary["amber"]
    if fair:
        line = f"{red} red, {amber} amber, fair on {fair[0].replace('-', ' ')}"
    else:
        line = f"{red} red, {amber} amber, no clean topic"
    return {
        "red": red,
        "amber": amber,
        "fair_topics": fair,
        "line": line,
        "flags": [
            {"rule_id": f.rule_id, "severity": f.severity, "topic": f.topic,
             "clause": f.clause, "title_en": f.title_en, "title_sw": f.title_sw}
            for f in analysis.flags
        ],
    }


def checklist(artist: str, work_id: str = "w-asali") -> list[dict]:
    redlines = store.list_redlines(artist)
    work = samples.work(work_id)
    people = {o["person"] for o in work.get("owners", []) if o["right"] == "composition"}
    confirmed = {c["person"] for c in work.get("split_confirmations", [])}
    items = [
        {
            "key": "red-lines",
            "ok": bool(redlines),
            "label_en": "Red lines set",
            "label_sw": "Mistari nyekundu imewekwa",
            "warning_en": "Set a standing red line (AI or term) before you sign.",
            "warning_sw": "Weka mstari mwekundu (AI au muda) kabla hujasaini.",
        },
        {
            "key": "ai-stance",
            "ok": any(r["kind"] == "ai-training" for r in redlines)
                  or store.has_event(artist, "ai-stance-set", artist),
            "label_en": "AI stance chosen",
            "label_sw": "Msimamo wa AI umechaguliwa",
            "warning_en": "Say never, opt-in, or granted for AI training.",
            "warning_sw": "Sema never, opt-in, au granted kwa mafunzo ya AI.",
        },
        {
            "key": "splits",
            "ok": _splits_ok(work),
            "label_en": "Splits total 100%",
            "label_sw": "Mgawanyo unafika 100%",
            "warning_en": "Co-writer shares must add up to 100.",
            "warning_sw": "Hisa za waandishi-wenza lazima zifikie 100.",
        },
        {
            "key": "consents",
            "ok": bool(people) and people <= confirmed,
            "label_en": "Every co-writer consented",
            "label_sw": "Kila mwandishi-mwenza amekubali",
            "warning_en": "A named collaborator has not confirmed their share.",
            "warning_sw": "Mshirika aliyepewa jina hajathibitisha hisa yake.",
        },
    ]
    return items
