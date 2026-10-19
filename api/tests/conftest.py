import os
import tempfile
from pathlib import Path

import pytest

_TMP = Path(tempfile.mkdtemp(prefix="kabla-test-"))
os.environ["KABLA_DB"] = str(_TMP / "test.sqlite")
os.environ["KABLA_KEY_DIR"] = str(_TMP / "keys")
os.environ["KABLA_MODE"] = "deterministic"


@pytest.fixture
def fresh_store():
    from kabla import store
    from kabla.cli import seed

    store.reset()
    seed()
    yield store
