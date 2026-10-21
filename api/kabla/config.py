"""Runtime configuration from the environment (and the repo's .env file)."""
from __future__ import annotations

import os
import shutil
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]


def _load_dotenv() -> None:
    env_file = REPO / ".env"
    if not env_file.exists():
        return
    # Why not plain setdefault: .env starts as a copy of .env.example, whose keys are empty placeholders
    # (OPENAI_API_KEY=). With setdefault the first (empty) line won and a real value added further down was
    # silently ignored. Now empty values are skipped and the LAST non-empty line wins (same rule as
    # scripts/omega_run.py); variables already set in the real environment still take priority.
    values: dict[str, str] = {}
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            if value.strip():
                values[key.strip()] = value.strip()
    for key, value in values.items():
        if not os.environ.get(key):
            os.environ[key] = value


def _repo_path(value: str) -> Path:
    p = Path(value)
    return p if p.is_absolute() else REPO / p


def _find_swipl(configured: str) -> str:
    for candidate in (configured, shutil.which("swipl"), r"C:\Program Files\swipl\bin\swipl.exe",
                      "/usr/bin/swipl", "/usr/local/bin/swipl", "/opt/homebrew/bin/swipl"):
        if candidate and (shutil.which(candidate) or Path(candidate).exists()):
            return candidate
    return configured


@dataclass(frozen=True)
class Settings:
    mode: str
    petta_home: Path
    swipl: str
    db_path: Path
    key_dir: Path
    data_dir: Path
    engine_dir: Path
    llm_provider: str
    llm_model: str

    @property
    def deterministic(self) -> bool:
        return self.mode != "live"


@lru_cache
def get_settings() -> Settings:
    _load_dotenv()
    return Settings(
        mode=os.environ.get("KABLA_MODE", "deterministic"),
        petta_home=_repo_path(os.environ.get("PETTA_HOME", ".vendor/PeTTa")),
        swipl=_find_swipl(os.environ.get("SWIPL", "swipl")),
        db_path=_repo_path(os.environ.get("KABLA_DB", "var/kabla.sqlite")),
        key_dir=_repo_path(os.environ.get("KABLA_KEY_DIR", "var/keys")),
        data_dir=REPO / "data",
        engine_dir=REPO / "engine",
        llm_provider=os.environ.get("KABLA_LLM_PROVIDER", "anthropic"),
        llm_model=os.environ.get("KABLA_LLM_MODEL", ""),
    )
