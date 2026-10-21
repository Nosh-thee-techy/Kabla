"""`.env` loading: a real value added below an empty placeholder must win, and the real environment still wins."""
import os

from kabla import config


def test_last_nonempty_value_wins_over_an_empty_placeholder(tmp_path, monkeypatch):
    (tmp_path / ".env").write_text(
        "OPENAI_API_KEY=\nKABLA_MODE=deterministic\n# note\nOPENAI_API_KEY=test-not-real\nKABLA_MODE=live\n",
        encoding="utf-8")
    monkeypatch.setattr(config, "REPO", tmp_path)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("KABLA_MODE", raising=False)
    config._load_dotenv()
    assert os.environ["OPENAI_API_KEY"] == "test-not-real" and os.environ["KABLA_MODE"] == "live"
    monkeypatch.delenv("OPENAI_API_KEY")
    monkeypatch.delenv("KABLA_MODE")


def test_real_environment_beats_the_file(tmp_path, monkeypatch):
    (tmp_path / ".env").write_text("KABLA_MODE=live\n", encoding="utf-8")
    monkeypatch.setattr(config, "REPO", tmp_path)
    monkeypatch.setenv("KABLA_MODE", "deterministic")
    config._load_dotenv()
    assert os.environ["KABLA_MODE"] == "deterministic"
