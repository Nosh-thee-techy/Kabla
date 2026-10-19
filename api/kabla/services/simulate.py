"""Earnings simulator. MeTTa does the maths; this module labels it illustrative."""
from __future__ import annotations

from kabla import store
from kabla.models import Scenario, Simulation
from kabla.services.extractor import extract
from kabla.services.facts import benchmark_file, contract_facts
from kabla.services.metta_bridge import query, run_engine


def _scenario(label: str, row: list) -> Scenario:
    _tag, _cid, streams, gross, earned, advance, debt, keeps = row
    return Scenario(label=label, royalty_pct=round(100 * earned / gross, 2) if gross else 0,
                    advance=advance, recoup_debt=debt, gross=gross,
                    royalty_earned=earned, artist_keeps=keeps)


def simulate(contract: dict, streams: int) -> Simulation:
    extraction = extract(contract)
    cid = extraction["contract_id"]
    facts = contract_facts(extraction, cid)
    queries = [query("as_written", f"(simulate {cid} {int(streams)})")]
    agreed = store.latest_negotiation(cid)
    source = "agreed" if agreed and agreed.get("state") == "agreed" else "artist-asks"
    if agreed and agreed.get("counter_facts"):
        facts = facts + agreed["counter_facts"]
        queries.append(query("counter", f"(simulate {cid}-counter {int(streams)})"))
    else:
        # artist-asks counter: 18% royalty, no cross-collateral, same advance
        from kabla.services.metta_bridge import Sym, fact
        facts += [
            fact(Sym("clause"), Sym(f"{cid}-counter"), 11, Sym("royalty"), 18, Sym("recoupable")),
            fact(Sym("clause"), Sym(f"{cid}-counter"), 15, Sym("cross-collateral"), Sym("no")),
        ]
        # copy advance from the original if present
        for c in extraction["clauses"]:
            if c["type"] == "advance":
                facts.append(fact(Sym("clause"), Sym(f"{cid}-counter"), int(c["n"]), Sym("advance"), c["attrs"][0]))
        queries.append(query("counter", f"(simulate {cid}-counter {int(streams)})"))
    run = run_engine(facts, queries, [benchmark_file()])
    written = run.one("as_written")[0]
    counter = run.one("counter")[0]
    return Simulation(
        contract_id=cid, streams=streams, profile="profile-illustrative-A",
        as_written=_scenario("as written", written),
        counter=_scenario("after negotiation", counter),
        counter_source=source,
    )
