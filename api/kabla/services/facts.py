"""Build MeTTa fact lines from structured data (extractions, red lines, works).

Purely mechanical translation: no judgement happens here.
"""
from __future__ import annotations

from pathlib import Path

from kabla.config import get_settings
from kabla.services.metta_bridge import Sym, fact, sym_or_str


def _attr(value):
    return value if isinstance(value, int | float) else sym_or_str(str(value))


def contract_facts(extraction: dict, contract_id: str | None = None) -> list[str]:
    cid = Sym(contract_id or extraction["contract_id"])
    out = [
        fact(Sym("contract"), cid),
        fact(Sym("contract-kind"), cid, Sym(extraction["kind"])),
        fact(Sym("contract-artist"), cid, Sym(extraction["artist"])),
    ]
    for role, name in extraction.get("parties", {}).items():
        out.append(fact(Sym("party"), cid, Sym(role), name))
    for c in extraction["clauses"]:
        out.append(fact(Sym("clause"), cid, int(c["n"]), Sym(c["type"]), *[_attr(a) for a in c["attrs"]]))
    return out


def redline_facts(artist: str, redlines: list[dict]) -> list[str]:
    return [fact(Sym("redline"), Sym(artist), Sym(r["kind"]), _attr(r["value"]), Sym(r["set_on"]))
            for r in redlines]


def benchmark_file() -> Path:
    return get_settings().data_dir / "policies" / "benchmarks.metta"


def policy_file(policy: str) -> Path:
    path = get_settings().data_dir / "policies" / f"{policy}.metta"
    if not path.exists():
        raise FileNotFoundError(f"no negotiation policy {policy!r}")
    return path
