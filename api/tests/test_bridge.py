import pytest

from kabla.services.metta_bridge import Sym, _decode, fact, parse_sexpr, query, run_engine, sym_or_str, to_metta


def test_to_metta_quotes_strings_and_keeps_symbols():
    assert to_metta(Sym("R-GRANT-01")) == "R-GRANT-01"
    assert to_metta('Say "hi"\nnow') == '"Say \\"hi\\" now"'
    assert fact(Sym("party"), Sym("c001"), Sym("label"), "Mawingu Records") == '(party c001 label "Mawingu Records")'


def test_unsafe_symbols_become_strings():
    assert isinstance(sym_or_str("perpetual"), Sym)
    assert sym_or_str("x) (evil") == "x) (evil"
    with pytest.raises(ValueError):
        Sym("(match &self")


def test_parse_sexpr_types():
    parsed = parse_sexpr('(result flags ((flag c001 4 R-GRANT-01 red) "Mawingu Records" 15000.0 true -5))')
    flag = ["flag", "c001", 4, "R-GRANT-01", "red"]
    assert parsed == ["result", "flags", [flag, "Mawingu Records", 15000.0, True, -5]]


def test_decode_latin1_section_sign():
    assert _decode(b'"c003-\xa76"') == '"c003-§6"'
    assert _decode(b"already unicode") == "already unicode"


def test_parse_sexpr_unicode_and_escapes():
    assert parse_sexpr('(result ref "c001-§7" "say \\"no\\"")') == ["result", "ref", "c001-§7", 'say "no"']


def test_run_engine_round_trip():
    run = run_engine(
        facts=[fact(Sym("clause"), Sym("tc"), 7, Sym("ai-training"), Sym("granted"), Sym("no-opt-in"))],
        queries=[query("flags", "(collapse (flags-of tc))")],
    )
    flags = run.one("flags")[0]
    assert flags == [["flag", "tc", 7, "R-AI-01", "red", ["clause", "tc", 7, "ai-training", "granted", "no-opt-in"]]]
