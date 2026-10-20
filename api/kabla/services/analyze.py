"""Run extraction + MeTTa flag rules and attach a bilingual trail.

MeTTa decides the flags, severities and red-line hits. This module only
translates those results into the API response.
"""
from __future__ import annotations

from kabla import store
from kabla.config import get_settings
from kabla.models import Analysis, Flag, TrailLine
from kabla.services import i18n
from kabla.services.extractor import extract
from kabla.services.facts import benchmark_file, contract_facts, redline_facts
from kabla.services.metta_bridge import query, run_engine


def _clause_severity(flags: list[Flag]) -> dict[int, str]:
    rank = {"red": 2, "amber": 1}
    out: dict[int, str] = {}
    for f in flags:
        if rank[f.severity] > rank.get(out.get(f.clause, ""), 0):
            out[f.clause] = f.severity
    return out


def analyze(contract: dict) -> Analysis:
    extraction = extract(contract)
    cid = extraction["contract_id"]
    facts = contract_facts(extraction, cid) + redline_facts(contract["artist"], store.list_redlines(contract["artist"]))
    run = run_engine(
        facts,
        [query("flags", f"(collapse (effective-flags {cid}))"),
         query("hits", f"(collapse (redline-hits-of {cid}))"),
         query("info", "(collapse (match &self (rule-info $r $s $t) ($r $s $t)))"),
         query("floor", f"(royalty-floor {cid})")],
        [benchmark_file()],
    )
    raw_flags = run.one("flags")[0] if run.one("flags") else []
    hits = {(h[2], h[3]): (h[4], h[5], h[6]) for h in (run.one("hits")[0] if run.one("hits") else [])}
    catalogue = {row[0]: (row[1], row[2]) for row in (run.one("info")[0] if run.one("info") else [])}
    floor = run.first_value("floor")

    flags: list[Flag] = []
    trail: list[TrailLine] = []
    for raw in raw_flags:
        _, _, n, rule, sev, fact = raw
        base, topic = catalogue.get(rule, (sev, "other"))
        texts = i18n.rule_texts(rule, n, fact, floor)
        lines = [TrailLine(rule_id=rule, clause_numbers=[] if n == 0 else [n],
                           facts=[" ".join(map(str, fact))],
                           text_en=texts["meaning_en"], text_sw=texts["meaning_sw"])]
        set_on = None
        if (n, rule) in hits:
            kind, value, date = hits[(n, rule)]
            set_on = date
            en, sw = i18n.redline_line(kind, value, date, n)
            lines.append(TrailLine(rule_id=rule, clause_numbers=[n],
                                   facts=[f"(redline {contract['artist']} {kind} {value} {date})"],
                                   text_en=en, text_sw=sw))
        trail.extend(lines)
        flags.append(Flag(
            clause=n, rule_id=rule, severity=sev, base_severity=base, topic=topic,
            title_en=texts["title_en"], title_sw=texts["title_sw"],
            meaning_en=texts["meaning_en"], meaning_sw=texts["meaning_sw"],
            cost_en=texts["cost_en"], cost_sw=texts["cost_sw"], trail=lines,
            redline_set_on=set_on,
        ))

    if not store.has_event(contract["artist"], "contract-analysed", cid):
        store.add_event(contract["artist"], "contract-analysed", cid,
                        {"red": sum(1 for f in flags if f.severity == "red"),
                         "amber": sum(1 for f in flags if f.severity == "amber")})
    return Analysis(
        contract_id=cid, mode=get_settings().mode, extraction_source=extraction["source"],
        clauses=extraction["clauses"], flags=flags,
        summary={"red": sum(1 for f in flags if f.severity == "red"),
                 "amber": sum(1 for f in flags if f.severity == "amber")},
        clause_severity=_clause_severity(flags), trail=trail,
    )
