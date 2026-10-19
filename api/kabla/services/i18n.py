"""Deterministic EN/SW template renderer. No LLM, no network.

Message keys come from engine/i18n_keys.metta (rule.R-AI-01, licence.R-LIC-OK, ...);
templates live in kabla/i18n/{en,sw}.json.
"""
from __future__ import annotations

import json
import string
from functools import lru_cache
from pathlib import Path

LANGS = ("en", "sw")
_DIR = Path(__file__).resolve().parent.parent / "i18n"


@lru_cache
def catalog(lang: str) -> dict:
    return json.loads((_DIR / f"{lang}.json").read_text(encoding="utf-8"))


class _Safe(dict):
    def __missing__(self, key: str) -> str:
        return "{" + key + "}"


def lookup(lang: str, key: str):
    node = catalog(lang)
    for part in key.split("."):
        node = node[part]
    return node


def t(lang: str, key: str, **params) -> str:
    template = lookup(lang, key)
    return string.Formatter().vformat(template, (), _Safe(params))


def both(key: str, **params) -> tuple[str, str]:
    return t("en", key, **params), t("sw", key, **params)


def has(key: str) -> bool:
    try:
        lookup("en", key)
        return True
    except KeyError:
        return False


def value_text(lang: str, value) -> str:
    if value == "perpetual":
        return t(lang, "value.perpetual")
    if isinstance(value, int | float):
        return t(lang, "value.years", value=value)
    return str(value)


def territory(lang: str, code: str) -> str:
    return catalog(lang)["territory"].get(code, code)


def right(lang: str, r: str) -> str:
    return catalog(lang)["right"].get(r, r)


def family(lang: str, f: str) -> str:
    return catalog(lang)["family"].get(f, f)


def glossary() -> list[dict]:
    en, sw = catalog("en").get("glossary", {}), catalog("sw").get("glossary", {})
    return [{"term": k, "en": en[k], "sw": sw.get(k, "")} for k in en]


def _rule_params(lang: str, rule: str, n: int, fact: list, floor) -> dict:
    """Template parameters read off the clause fact the rule matched."""
    params: dict = {"n": n, "floor": floor}
    if not fact or fact[0] != "clause":
        return params
    ctype, attrs = fact[3], fact[4:]
    if ctype == "grant":
        params["right"] = right(lang, attrs[0])
    elif ctype == "term":
        params["value"] = value_text(lang, attrs[0])
    elif ctype in ("royalty", "option-periods"):
        params["value"] = attrs[0]
    return params


def rule_texts(rule: str, n: int, fact: list, floor=None) -> dict:
    """title/meaning/cost in both languages for one flag."""
    out = {}
    for lang in LANGS:
        params = _rule_params(lang, rule, n, fact, floor)
        node = lookup(lang, f"rule.{rule}")
        meaning_key = "meaning_missing" if n == 0 and "meaning_missing" in node else "meaning"
        for field, key in (("title", "title"), ("meaning", meaning_key), ("cost", "cost")):
            out[f"{field}_{lang}"] = t(lang, f"rule.{rule}.{key}", **params)
    return out


def redline_line(kind: str, value, date: str, n: int) -> tuple[str, str]:
    out = []
    for lang in LANGS:
        said = t(lang, f"redline.{kind}", value=value)
        out.append(t(lang, "redline.line", date=date, said=said, n=n))
    return out[0], out[1]
