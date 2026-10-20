"""Plugin files exist; they are not loaded in a live Omega agent."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLUGIN = ROOT / "omega-plugin"


def test_plugin_declares_loadOmegaPlugin_and_skills():
    text = (PLUGIN / "kabla_plugin.metta").read_text(encoding="utf-8")
    assert "(= (loadOmegaPlugin)" in text
    for skill in ("kabla-analyze", "kabla-licence", "kabla-redline-set", "kabla-explain"):
        assert skill in text


def test_helpers_are_http_only():
    text = (PLUGIN / "kabla_skills.py").read_text(encoding="utf-8")
    assert "verdict" not in text.lower() or "_post" in text
    assert "KABLA_API_URL" in text
