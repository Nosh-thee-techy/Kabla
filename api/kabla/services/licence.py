"""Licence Desk: MeTTa decides cleared / not-cleared / needs-consent."""
from __future__ import annotations

from kabla import store
from kabla.models import Condition, LicenceRequest, LicenceVerdict, MissingConsent, TrailLine
from kabla.services import i18n, samples
from kabla.services.facts import redline_facts
from kabla.services.metta_bridge import Sym, fact, query, run_engine, to_metta


def work_facts(work: dict, terms: dict) -> list[str]:
    wid = Sym(work["id"])
    out = [
        fact(Sym("work"), wid, work["title"]),
        fact(Sym("licensor"), wid, Sym(work["artist"])),
    ]
    for owner in work["owners"]:
        out.append(fact(Sym("owner"), wid, Sym(owner["right"]), Sym(owner["person"]), owner["share"]))
    for c in work.get("consents", []):
        out.append(fact(Sym("consent"), wid, Sym(c["person"]), Sym(c["use_family"]),
                        Sym(c["territory"]), Sym(c["date"])))
    for key, value, ref in (
        ("ai-training", terms.get("ai_training", "opt-in-paid"), terms.get("ai_ref", "c003-§6")),
        ("voice-likeness", terms.get("voice_likeness", "promo-only"), terms.get("voice_ref", "c003-§7")),
        ("max-licence-months", terms.get("max_licence_months", work.get("max_licence_months", 12)),
         terms.get("term_ref", "work-policy")),
    ):
        out.append(fact(Sym("terms"), wid, Sym(key), value if isinstance(value, int) else Sym(str(value)), ref))
    return out


def _terms_for(work: dict) -> dict:
    """Passport terms if issued; otherwise the work's own policy + artist's red lines."""
    stored = store.get_work(work["id"])
    if stored and stored.get("terms"):
        terms = dict(stored["terms"])
        if terms.get("ai_training") not in ("opt-in-paid", "prohibited", "granted"):
            terms["ai_training"] = "opt-in-paid"
        return terms
    return {
        "ai_training": "opt-in-paid", "voice_likeness": "promo-only",
        "max_licence_months": work.get("max_licence_months", 12),
        "ai_ref": "c003-§6", "voice_ref": "c003-§7", "term_ref": "work-policy",
    }


def check(req: LicenceRequest, request_id: str) -> LicenceVerdict:
    work = samples.work(req.work_id)
    artist = work["artist"]
    terms = _terms_for(work)
    facts = (work_facts(work, terms) + redline_facts(artist, store.list_redlines(artist)) +
             [fact(Sym("request"), Sym(request_id), Sym(work["id"]), Sym(req.use),
                   Sym(req.territory), req.months, req.party)])
    run = run_engine(facts, [
        query("decision", f"(licence-decision {request_id})"),
        query("missing", f"(collapse (missing-consents {request_id}))"),
        query("conditions", f"(collapse (licence-conditions {request_id}))"),
    ])
    # (result decision (decision rid verdict rule refs facts))
    dec = run.one("decision")[0]
    _tag, _rid, verdict, rule, refs, used = dec
    missing_raw = run.one("missing")[0] if run.one("missing") else []
    cond_raw = run.one("conditions")[0] if run.one("conditions") else []

    missing = [MissingConsent(person=m[2], name=samples.artist_name(m[2]), right=m[3], share=m[4])
               for m in missing_raw if isinstance(m, list)]
    conditions = [_condition(c) for c in cond_raw if isinstance(c, list)]
    headline_en, headline_sw = _headline(rule, work, req, missing, refs, artist)
    trail = [TrailLine(rule_id=rule, clause_numbers=_clause_nums(refs),
                       facts=[to_metta(x) if isinstance(x, list) else str(x) for x in used],
                       text_en=headline_en, text_sw=headline_sw)]
    record = {"request_id": request_id, "work_id": work["id"], "verdict": verdict, "rule_id": rule}
    store.put_licence(record)
    if verdict == "cleared" and not store.has_event(artist, "licence-cleared", request_id):
        store.add_event(artist, "licence-cleared", request_id, {"party": req.party})
    if verdict != "cleared" and not store.has_event(artist, "licence-missing-consent", request_id) and missing:
        store.add_event(artist, "licence-missing-consent", request_id,
                        {"people": [m.person for m in missing]})
    return LicenceVerdict(request_id=request_id, verdict=verdict, rule_id=rule,
                          headline_en=headline_en, headline_sw=headline_sw,
                          missing=missing, conditions=conditions, trail=trail)


def _clause_nums(refs) -> list[int]:
    out = []
    for ref in refs if isinstance(refs, list) else []:
        if isinstance(ref, str) and "§" in ref:
            try:
                out.append(int(ref.split("§")[-1]))
            except ValueError:
                pass
    return out


def _condition(row: list) -> Condition:
    _tag, _rid, key, detail, ref = row
    params = {"ref": ref}
    if key == "term-window":
        params["months"], params["max"] = detail
    elif key == "territory-limit":
        params["terr"] = i18n.territory("en", detail)
    else:
        params["value"] = detail
    en, sw = i18n.both(f"condition.{key}", **params)
    if key == "territory-limit":
        sw = i18n.t("sw", "condition.territory-limit", terr=i18n.territory("sw", detail))
    return Condition(key=key, text_en=en, text_sw=sw, ref=None if ref == "none" else str(ref))


def _headline(rule: str, work: dict, req: LicenceRequest, missing: list[MissingConsent],
              refs, artist: str) -> tuple[str, str]:
    ref = refs[0] if isinstance(refs, list) and refs else ""
    lines = store.list_redlines(artist)
    date = next((r["set_on"] for r in lines if r["kind"] == "ai-training"), "")
    items = {"en": [], "sw": []}
    for m in missing:
        items["en"].append(i18n.t("en", "licence.missing_item", who=m.name, share=int(m.share),
                                  right=i18n.right("en", m.right)))
        items["sw"].append(i18n.t("sw", "licence.missing_item", who=m.name, share=int(m.share),
                                  right=i18n.right("sw", m.right)))
    joiner = {"en": ", ", "sw": ", "}
    params = {
        "ref": ref, "artist": samples.artist_name(artist), "date": date,
        "months": req.months, "max": work.get("max_licence_months", 12),
        "family": i18n.family("en", {"ad": "sync", "sync-ad": "sync", "sync-film": "sync",
                                     "live": "live", "sample": "sample", "ai-training": "ai-training"}[req.use]),
        "terr": i18n.territory("en", req.territory),
        "list": joiner["en"].join(items["en"]) or "someone",
    }
    en = i18n.t("en", f"licence.{rule}", **params)
    params["family"] = i18n.family("sw", {"ad": "sync", "sync-ad": "sync", "sync-film": "sync",
                                          "live": "live", "sample": "sample", "ai-training": "ai-training"}[req.use])
    params["terr"] = i18n.territory("sw", req.territory)
    params["list"] = joiner["sw"].join(items["sw"]) or "mtu"
    sw = i18n.t("sw", f"licence.{rule}", **params)
    return en, sw
