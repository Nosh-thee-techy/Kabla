"""Golden test: each sample contract yields exactly the expected flags."""
import json
from pathlib import Path

import pytest

from kabla.config import get_settings
from kabla.services.facts import benchmark_file, contract_facts, redline_facts
from kabla.services.metta_bridge import query, run_engine

GOLDEN = json.loads((Path(__file__).parent / "golden" / "flags.json").read_text(encoding="utf-8"))


def _load(name: str) -> dict:
    return json.loads((get_settings().data_dir / name).read_text(encoding="utf-8"))


@pytest.mark.parametrize("cid", ["c001", "c002", "c003"])
def test_sample_contract_flags_match_golden(cid):
    extraction = _load(f"extractions/{cid}.json")
    artist = _load("artists/zawadi.json")
    facts = contract_facts(extraction) + redline_facts("zawadi", artist["redlines"])
    run = run_engine(facts, [query("flags", f"(collapse (effective-flags {cid}))")], [benchmark_file()])
    got = sorted([f[2], f[3], f[4]] for f in run.one("flags")[0])
    assert got == sorted(GOLDEN[cid])


def test_redline_hits_cite_dates_for_c001():
    extraction = _load("extractions/c001.json")
    artist = _load("artists/zawadi.json")
    facts = contract_facts(extraction) + redline_facts("zawadi", artist["redlines"])
    run = run_engine(facts, [query("hits", "(collapse (redline-hits-of c001))")], [benchmark_file()])
    hits = {(h[2], h[3]): h[6] for h in run.one("hits")[0]}
    assert hits == {(7, "R-AI-01"): "2026-10-19", (5, "R-TERM-01"): "2026-10-19"}
