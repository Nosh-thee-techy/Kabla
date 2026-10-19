"""Negotiation Theater: MeTTa picks the label's move; the artist decides every concession."""
from __future__ import annotations

import re
import uuid
from collections import defaultdict

from kabla import store
from kabla.models import DecideRequest, NegoSession, NegoTopic
from kabla.services.analyze import analyze
from kabla.services.extractor import extract
from kabla.services.facts import policy_file
from kabla.services.metta_bridge import Sym, fact, query, run_engine

MAX_ROUNDS = 4
PRIORITY = ["ai-training", "voice-likeness", "grant", "term", "reversion", "royalty",
            "cross-collateral", "option-periods", "audit", "sync-approval", "splits"]


def parse_policy(name: str) -> dict:
    steps: dict[str, dict[int, str | int]] = defaultdict(dict)
    floors: dict[str, int] = {}
    lines: dict[str, str] = {}
    for raw in policy_file(name).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if m := re.match(r"\(policy-step (\S+) (\S+) (\d+) (\S+)\)", line):
            steps[m.group(2)][int(m.group(3))] = _atom(m.group(4))
        elif m := re.match(r"\(policy-floor (\S+) (\S+) (\d+)\)", line):
            floors[m.group(2)] = int(m.group(3))
        elif m := re.match(r'\(policy-line (\S+) (\S+) "(.*)"\)', line):
            lines[m.group(2)] = m.group(3)
    return {"name": name, "steps": dict(steps), "floors": floors, "lines": lines}


def _atom(tok: str):
    try:
        return int(tok)
    except ValueError:
        return tok


def ladder_value(topic: str, clause: dict) -> str | int:
    attrs = clause["attrs"]
    kind = clause["type"]
    if kind == "grant":
        _, dur, terr, excl = attrs
        if dur == "perpetual" and terr == "worldwide" and excl == "exclusive":
            return "perpetual-worldwide-exclusive"
        if terr == "worldwide":
            return "term-worldwide-exclusive"
        return "term-africa-exclusive"
    if kind == "ai-training":
        return "granted" if attrs[:1] == ["granted"] else attrs[0]
    if kind == "voice-likeness":
        return attrs[-1]
    if kind == "option-periods":
        return f"{attrs[1]}-{attrs[0]}" if attrs[1] == "label-only" else attrs[1]
    if kind == "splits":
        return "not-stated" if attrs[0] == "not-stated" else f"stated-{attrs[1]}"
    return attrs[0]


def artist_ask(topic: str, redlines: list[dict]) -> str | int:
    by_kind = {r["kind"]: r["value"] for r in redlines}
    if topic == "ai-training":
        return by_kind.get("ai-training", "opt-in-paid")
    if topic == "term":
        return int(by_kind.get("term-max-years", 7))
    defaults: dict[str, str | int] = {
        "voice-likeness": "promo-only", "grant": "term-africa-exclusive", "reversion": 7,
        "royalty": 18, "cross-collateral": "no", "option-periods": "label-only-2",
        "audit": "yes", "sync-approval": "artist-approval", "splits": "stated-100",
    }
    return defaults[topic]


def _index(policy: dict, topic: str, value) -> int:
    for i, v in policy["steps"][topic].items():
        if v == value:
            return i
    return 0


def start(contract: dict) -> NegoSession:
    extraction = extract(contract)
    analysis = analyze(contract)
    policy_name = extraction.get("policy") or "mawingu"
    policy = parse_policy(policy_name)
    redlines = store.list_redlines(contract["artist"])
    clauses = {c["n"]: c for c in extraction["clauses"]}
    topics = []
    for flag in sorted(analysis.flags, key=lambda f: PRIORITY.index(f.topic) if f.topic in PRIORITY else 99):
        if flag.topic not in policy["steps"] or flag.clause not in clauses:
            continue
        current = ladder_value(flag.topic, clauses[flag.clause])
        ask = artist_ask(flag.topic, redlines)
        is_rl = ((flag.topic == "term" and any(r["kind"] == "term-max-years" for r in redlines))
                 or (flag.topic == "ai-training" and any(r["kind"] == "ai-training" for r in redlines)))
        topics.append({
            "topic": flag.topic, "clause": flag.clause, "current": current, "ask": ask,
            "label_pos": _index(policy, flag.topic, current), "status": "open",
            "is_redline": is_rl, "severity": flag.severity, "rule_id": flag.rule_id,
            "offered": current, "kind": "counter", "policy_line": policy["lines"].get(flag.topic, ""),
            "advice": "hold-flagged", "advice_value": ask,
        })
    session = {
        "id": "n-" + uuid.uuid4().hex[:8], "contract_id": contract["id"], "policy": policy_name,
        "round": 0, "max_rounds": MAX_ROUNDS, "state": "open", "topics": topics, "ledger": [],
        "unresolved": [], "artist": contract["artist"], "extraction": extraction,
    }
    session["ledger"].append({"round": 0, "actor": "artist-agent", "topic": "*", "action": "open",
                              "value": [t["topic"] for t in topics], "rule_id": "N-OPEN",
                              "policy_line": "Artist agent opens flagged topics in priority order."})
    return _advance(session, policy)


def decide(session: dict, body: DecideRequest) -> NegoSession:
    policy = parse_policy(session["policy"])
    by_topic = {d.topic: d.decision for d in body.decisions}
    walk = False
    for topic in session["topics"]:
        if topic["status"] != "open":
            continue
        choice = by_topic.get(topic["topic"])
        if not choice:
            continue
        session["ledger"].append({
            "round": session["round"], "actor": "artist", "topic": topic["topic"],
            "action": choice, "value": topic["offered"], "rule_id": f"N-ARTIST-{choice.upper()}",
            "policy_line": topic["policy_line"],
        })
        if choice == "approve":
            if topic["kind"] in ("counter", "accept"):
                topic["current"] = topic["offered"]
                topic["label_pos"] = _index(policy, topic["topic"], topic["offered"])
            if topic["kind"] in ("accept", "reject") or topic["current"] == topic["ask"]:
                topic["status"] = "agreed"
        elif choice == "reject":
            if topic["kind"] == "reject" and topic["is_redline"]:
                walk = True
                topic["status"] = "rejected"
            elif topic["kind"] == "reject":
                topic["status"] = "rejected"
    if walk:
        session["state"] = "walk-away"
        session["unresolved"] = [t["topic"] for t in session["topics"] if t["status"] != "agreed"]
        session["lawyer_note"] = _lawyer_note(session)
        store.put_negotiation(session)
        return _out(session)
    if all(t["status"] == "agreed" for t in session["topics"]):
        return _finish(session, "agreed")
    if session["round"] >= MAX_ROUNDS:
        return _finish(session, "standoff")
    return _advance(session, policy)


def _advance(session: dict, policy: dict) -> NegoSession:
    session["round"] += 1
    facts = [fact(Sym("neg-policy"), Sym(session["policy"]))]
    for t in session["topics"]:
        if t["status"] != "open":
            continue
        ask = t["ask"] if isinstance(t["ask"], int) else Sym(str(t["ask"]))
        facts += [
            fact(Sym("neg-open"), Sym(t["topic"]), ask, t["label_pos"]),
            fact(Sym("neg-redline"), Sym(t["topic"]), True if t["is_redline"] else False),
        ]
    run = run_engine(facts, [query("rounds", "(collapse (rounds))")], [policy_file(session["policy"])])
    rows = run.one("rounds")[0] if run.one("rounds") else []
    by_topic = {row[1]: row for row in rows}
    for t in session["topics"]:
        row = by_topic.get(t["topic"])
        if not row:
            continue
        _tag, topic, kind, offered, line, advice = row
        t["kind"] = kind
        t["offered"] = offered
        t["policy_line"] = line
        t["advice"] = advice[2]
        t["advice_value"] = advice[3]
        session["ledger"].append({
            "round": session["round"], "actor": "label-agent", "topic": topic,
            "action": kind, "value": offered, "rule_id": f"N-LABEL-{kind.upper()}",
            "policy_line": line,
        })
    store.put_negotiation(session)
    return _out(session)


def _finish(session: dict, state: str) -> NegoSession:
    session["state"] = state
    session["unresolved"] = [t["topic"] for t in session["topics"] if t["status"] != "agreed"]
    session["lawyer_note"] = _lawyer_note(session) if session["unresolved"] else None
    session["counter_facts"] = _counter_facts(session)
    store.put_negotiation(session)
    return _out(session)


def _lawyer_note(session: dict) -> str:
    names = ", ".join(session["unresolved"]) or "none"
    return (f"Unresolved after {session['round']} rounds: {names}. "
            "A lawyer should look at each unresolved clause before anyone signs.")


def _counter_facts(session: dict) -> list[str]:
    cid = Sym(f"{session['contract_id']}-counter")
    out = []
    for t in session["topics"]:
        value = t["current"]
        n = t["clause"]
        topic = t["topic"]
        if topic == "grant":
            attrs = {
                "perpetual-worldwide-exclusive": ["master", "perpetual", "worldwide", "exclusive"],
                "term-worldwide-exclusive": ["master", "term-limited", "worldwide", "exclusive"],
                "term-africa-exclusive": ["master", "term-limited", "africa", "exclusive"],
            }[value]
            out.append(fact(Sym("clause"), cid, n, Sym("grant"), *[a if isinstance(a, int) else Sym(a) for a in attrs]))
        elif topic == "ai-training":
            if value == "granted":
                out.append(fact(Sym("clause"), cid, n, Sym("ai-training"), Sym("granted"), Sym("no-opt-in")))
            else:
                out.append(fact(Sym("clause"), cid, n, Sym("ai-training"), Sym(str(value))))
        elif topic == "voice-likeness":
            out.append(fact(Sym("clause"), cid, n, Sym("voice-likeness"), Sym("granted"), Sym(str(value))))
        elif topic == "option-periods":
            count = int(str(value).rsplit("-", 1)[-1]) if "label-only" in str(value) else 1
            who = "label-only" if "label-only" in str(value) else "mutual"
            out.append(fact(Sym("clause"), cid, n, Sym("option-periods"), count, Sym(who)))
        elif topic == "royalty":
            out.append(fact(Sym("clause"), cid, n, Sym("royalty"), int(value), Sym("recoupable")))
        else:
            out.append(fact(Sym("clause"), cid, n, Sym(topic), value if isinstance(value, int) else Sym(str(value))))
    return out


def _out(session: dict) -> NegoSession:
    return NegoSession(
        id=session["id"], contract_id=session["contract_id"], policy=session["policy"],
        round=session["round"], max_rounds=session["max_rounds"], state=session["state"],
        topics=[NegoTopic(**{k: t[k] for k in NegoTopic.model_fields}) for t in session["topics"]],
        ledger=session["ledger"], unresolved=session.get("unresolved") or [],
        lawyer_note=session.get("lawyer_note"),
    )


def transcript(session: dict) -> str:
    lines = [
        "# Negotiation transcript (SYNTHETIC)",
        "",
        f"Session `{session['id']}` · contract `{session['contract_id']}` · "
        f"policy `{session['policy']}` · state **{session['state']}**.",
        "",
        "| Round | Actor | Topic | Action | Value | Policy / rule |",
        "|---|---|---|---|---|---|",
    ]
    for m in session["ledger"]:
        src = m.get("policy_line") or m.get("rule_id")
        lines.append(
            f"| {m['round']} | {m['actor']} | {m['topic']} | {m['action']} | {m['value']} | {src} |"
        )
    if session.get("lawyer_note"):
        lines += ["", session["lawyer_note"]]
    return "\n".join(lines) + "\n"
