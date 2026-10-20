"""Rights-health score. MeTTa adds the points; this module only formats them."""
from __future__ import annotations

from kabla import store
from kabla.services.metta_bridge import Sym, fact, query, run_engine

REASONS = {
    "work-registered": "Work registered with hash and artist consent",
    "contributors-listed": "All contributors listed",
    "ai-tools-disclosed": "AI tools used on the work are disclosed",
    "ai-stance-set": "AI-training stance explicitly set",
    "splits-agreed": "Splits agreed by every co-writer and total 100%",
    "contract-clean": "Contract analysed and no unresolved red flags",
    "licence-cleared": "A licence was granted with all required consents",
    "unresolved-red-signed": "Unresolved red flag in a signed contract",
    "licence-missing-consent": "Licence granted without a required consent",
}

def score(artist: str) -> dict:
    return score_from_events(artist, store.list_events(artist))


def score_from_events(artist: str, events: list[dict]) -> dict:
    facts = [fact(Sym("event"), Sym(e["id"]), Sym(artist), Sym(e["type"]),
                  Sym(str(e["subject"])), Sym(e["date"])) for e in events]
    run = run_engine(facts, [
        query("total", f"(score-of {artist})"),
        query("points", f"(collapse (event-points {artist}))"),
    ])
    total = run.first_value("total", 0)
    reasons = []
    for row in (run.one("points")[0] if run.one("points") else []):
        _tag, eid, points, type_, subject = row
        reasons.append({"event_id": eid, "points": points, "type": type_, "subject": subject,
                        "why": REASONS.get(type_, type_)})
    return {
        "artist": artist, "score": total, "max": 100,
        "label": "rights-health, not credit",
        "hypothetical": any(str(e["id"]).startswith("hyp-") for e in events),
        "next_best_steps": _next_steps(set(r["type"] for r in reasons)),
        "reasons": reasons,
    }


def merge_hypothetical(artist: str, extras: list[dict]) -> list[dict]:
    """Store events plus extras that are not already present (type+subject)."""
    events = list(store.list_events(artist))
    seen = {(e["type"], str(e["subject"])) for e in events}
    out = events[:]
    for i, extra in enumerate(extras):
        key = (extra["type"], str(extra["subject"]))
        if key in seen:
            continue
        seen.add(key)
        out.append({
            "id": extra.get("id") or f"hyp-{i}",
            "artist": artist,
            "type": extra["type"],
            "subject": extra["subject"],
            "date": extra.get("date") or store.today(),
        })
    return out


def _next_steps(have: set[str]) -> list[str]:
    order = ["work-registered", "contributors-listed", "ai-tools-disclosed", "ai-stance-set",
             "splits-agreed", "contract-clean", "licence-cleared"]
    return [REASONS[k] for k in order if k not in have]
