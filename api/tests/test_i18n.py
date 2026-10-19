import re

from kabla.services import i18n

FLAG_RULES = ["R-GRANT-01", "R-GRANT-02", "R-TERM-01", "R-AI-01", "R-AI-02", "R-VOICE-01", "R-REVERT-01",
              "R-XCOLL-01", "R-OPT-01", "R-ROY-01", "R-AUDIT-01", "R-SYNC-01", "R-SPLIT-01"]


def test_every_rule_has_en_and_sw_text():
    for rule in FLAG_RULES:
        for lang in i18n.LANGS:
            node = i18n.lookup(lang, f"rule.{rule}")
            assert node["title"] and node["meaning"] and node["cost"], (lang, rule)


def test_en_and_sw_catalogs_have_same_keys():
    def keys(node, prefix=""):
        out = set()
        for k, v in node.items():
            if k.startswith("_"):
                continue
            out |= keys(v, f"{prefix}{k}.") if isinstance(v, dict) else {prefix + k}
        return out

    assert keys(i18n.catalog("en")) == keys(i18n.catalog("sw"))


def test_rule_texts_fill_parameters_from_the_fact():
    texts = i18n.rule_texts("R-TERM-01", 5, ["clause", "c001", 5, "term", "perpetual"])
    assert texts["meaning_en"] == "Clause 5 ties the rights up for ever, beyond the limit you set."
    assert "milele" in texts["meaning_sw"]
    ten = i18n.rule_texts("R-TERM-01", 4, ["clause", "c002", 4, "term", 10])
    assert "up for 10 years" in ten["meaning_en"] and "kwa miaka 10" in ten["meaning_sw"]
    roy = i18n.rule_texts("R-ROY-01", 11, ["clause", "c001", 11, "royalty", 12, "recoupable"], floor=18)
    assert "12%" in roy["meaning_en"] and "18%" in roy["meaning_sw"]
    for text in (*texts.values(), *roy.values()):
        assert not re.search(r"\{\w+\}", text), text


def test_redline_line_both_languages():
    en, sw = i18n.redline_line("ai-training", "never", "2026-10-19", 7)
    assert en == "You told Kabla on 2026-10-19: never AI training. Clause 7 breaks this."
    assert "2026-10-19" in sw and "Kifungu 7" in sw
