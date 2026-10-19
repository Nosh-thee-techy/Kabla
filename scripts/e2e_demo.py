#!/usr/bin/env python3
"""Headless run of the three demo scenes. Writes docs/transcripts/*.md."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))

from kabla import store  # noqa: E402
from kabla.cli import seed  # noqa: E402
from kabla.models import DecideRequest, Decision, LicenceRequest, WorkCreate  # noqa: E402
from kabla.services import analyze as analyze_svc  # noqa: E402
from kabla.services import licence as licence_svc  # noqa: E402
from kabla.services import negotiator  # noqa: E402
from kabla.services import passport as passport_svc  # noqa: E402
from kabla.services import samples  # noqa: E402


def scene1(out: Path) -> dict:
    text = samples.contract_text("c001")
    store.put_contract({"id": "c001", "sample_id": "c001", "title": "Exclusive Recording Agreement",
                        "text": text, "artist": "zawadi", "kind": "recording", "label": "Mawingu Records"})
    result = analyze_svc.analyze(store.get_contract("c001"))
    lines = [f"# Scene 1 — contract analysis (SYNTHETIC)", "",
             f"{result.summary['red']} red, {result.summary['amber']} amber flags.", ""]
    for f in result.flags:
        lines.append(f"## {f.rule_id} · clause {f.clause} · {f.severity}")
        lines.append(f"- EN: {f.meaning_en}")
        lines.append(f"- SW: {f.meaning_sw}")
        for t in f.trail:
            lines.append(f"  - trail: {t.text_en}")
        lines.append("")
    (out / "01-contract-analysis.md").write_text("\n".join(lines), encoding="utf-8")
    return result.model_dump()


def scene2(out: Path) -> dict:
    session = negotiator.start(store.get_contract("c001"))
    body = session.model_dump()
    # Approve everything except option-periods — matches the demo "rejects one"
    while body["state"] == "open":
        decisions = [Decision(topic=t["topic"], decision="reject" if t["topic"] == "option-periods" else "approve")
                     for t in body["topics"] if t["status"] == "open"]
        session = negotiator.decide(store.get_negotiation(body["id"]), DecideRequest(decisions=decisions))
        body = session.model_dump()
    md = negotiator.transcript(store.get_negotiation(body["id"]))
    (out / "02-negotiation.md").write_text(md, encoding="utf-8")
    return body


def scene3(out: Path) -> dict:
    store.put_contract({"id": "c003", "sample_id": "c003", "title": "Non-Exclusive Distribution Licence",
                        "text": samples.contract_text("c003"), "artist": "zawadi", "kind": "distribution",
                        "label": "Kilele Collective"})
    analyze_svc.analyze(store.get_contract("c003"))
    passport_svc.register(WorkCreate(work_id="w-asali", consent_to_register=True, consent_to_sell=False))
    issued = passport_svc.issue("zawadi")
    reqs = [
        LicenceRequest(work_id="w-asali", use="ad", territory="KE", months=6, party="Nuru Soaps"),
        LicenceRequest(work_id="w-asali", use="ai-training", territory="WW", months=12, party="Nuru Labs"),
        LicenceRequest(work_id="w-asali", use="sync-film", territory="US", months=3, party="Exhibition"),
    ]
    verdicts = [licence_svc.check(r, f"demo-{i}").model_dump() for i, r in enumerate(reqs)]
    mutated = passport_svc.tamper(issued["certificate"])
    broken = passport_svc.verify(mutated, None)
    lines = ["# Scene 3 — passport and three requests (SYNTHETIC)", "",
             f"Score: {issued['score']['score']} ({issued['score']['label']})", "",
             "## Licence verdicts"]
    for v in verdicts:
        lines.append(f"- {v['rule_id']}: {v['verdict']} — {v['headline_en']}")
    lines += ["", "## Tamper test", f"- intact original: {passport_svc.verify(issued['certificate'], None)['intact']}",
              f"- after one-character change: {broken['intact']} — {broken['reason']}"]
    (out / "03-licence-verdicts.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    (out / "04-tamper-test.md").write_text("# Tamper test\n\n" + json.dumps(broken, indent=2) + "\n", encoding="utf-8")
    return {"verdicts": [v["verdict"] for v in verdicts], "tamper": broken}


def main() -> None:
    store.reset()
    seed()
    out = ROOT / "docs" / "transcripts"
    out.mkdir(parents=True, exist_ok=True)
    s1 = scene1(out)
    s2 = scene2(out)
    s3 = scene3(out)
    print("scene1 flags", len(s1["flags"]))
    print("scene2 state", s2["state"])
    print("scene3 verdicts", s3["verdicts"], "tamper intact", s3["tamper"]["intact"])
    assert s2["state"] in ("standoff", "walk-away", "agreed")
    assert s3["verdicts"] == ["cleared", "not-cleared", "needs-consent"]
    assert s3["tamper"]["intact"] is False
    print("e2e demo transcripts written to", out)


if __name__ == "__main__":
    main()
