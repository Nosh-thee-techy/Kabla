"""Helpers are HTTP clients. We only check they exist and refuse to invent verdicts."""
import ast
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_plugin_has_loadOmegaPlugin():
    text = (ROOT / "kabla_plugin.metta").read_text(encoding="utf-8")
    assert "(= (loadOmegaPlugin)" in text
    for skill in ("kabla-analyze", "kabla-licence", "kabla-redline-set", "kabla-explain"):
        assert skill in text


def test_python_helpers_have_no_verdict_logic():
    tree = ast.parse((ROOT / "kabla_skills.py").read_text(encoding="utf-8"))
    names = {n.name for n in tree.body if isinstance(n, ast.FunctionDef)}
    assert names >= {"analyze", "licence", "redline_set", "explain"}
