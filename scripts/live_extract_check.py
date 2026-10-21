#!/usr/bin/env python3
"""Does the live reader (an LLM) read the three SYNTHETIC contracts the way the reviewed fixtures do?

Why: deterministic mode reads only the three samples, through hand-reviewed fixtures. Live mode lets a model read
any pasted text. This feeds each sample's raw text to the live reader (as if pasted: no sample id) and compares the
clauses it returns with the fixture a human reviewed. It prints agreement, misses and extras, never a key.
Needs KABLA_MODE=live, KABLA_LLM_PROVIDER, a key and (for non-OpenAI servers) KABLA_LLM_URL in .env or the environment.
Writes docs/evidence/live-extract.md.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "api"))
os.environ.setdefault("KABLA_MODE", "live")

from kabla.config import get_settings  # noqa: E402  (loads .env)
from kabla.services import samples  # noqa: E402
from kabla.services.llm import extract_with_llm  # noqa: E402


def key_of(c: dict) -> tuple:
    return (c["type"], json.dumps(c["attrs"], sort_keys=True))


def main() -> int:
    s = get_settings()
    print(f"mode={s.mode} provider={s.llm_provider} model={s.llm_model or '(default)'} "
          f"url={os.environ.get('KABLA_LLM_URL', '(provider default)')}")
    if s.deterministic:
        print("KABLA_MODE is not live")
        return 2
    rows, total_ok, total_ref = [], 0, 0
    for sid in ("c001", "c002", "c003"):
        ref = samples.fixture(sid)
        contract = {"id": f"check-{sid}", "text": samples.contract_text(sid), "artist": ref["artist"]}
        t0 = time.time()
        try:
            got = extract_with_llm(contract)
        except Exception as exc:  # noqa: BLE001  (report, never crash the whole check)
            rows.append((sid, f"ERROR {type(exc).__name__}: {str(exc)[:120]}", 0, len(ref["clauses"]), 0, 0, 0, round(time.time() - t0)))
            total_ref += len(ref["clauses"])
            print(f"{sid}: ERROR {type(exc).__name__}")
            continue
        want = {key_of(c) for c in ref["clauses"]}
        have = {key_of(c) for c in got["clauses"]}
        ok, miss, extra = want & have, want - have, have - want
        total_ok += len(ok)
        total_ref += len(want)
        rows.append((sid, "ok", len(ok), len(want), len(miss), len(extra), len(got["dropped"]), round(time.time() - t0)))
        print(f"{sid}: matched {len(ok)}/{len(want)}  missed {len(miss)}  extra {len(extra)}  dropped-as-invalid {len(got['dropped'])}  ({round(time.time() - t0)}s)")
        for m in sorted(miss):
            print("   missed:", m)
        for e in sorted(extra):
            print("   extra: ", e)
    md = ["# Live reader check (model reads raw text, compared with the reviewed fixtures)", "",
          f"Run {time.strftime('%Y-%m-%d %H:%M:%S')}. Model: `{s.llm_model or 'default'}` via provider `{s.llm_provider}`. "
          "SYNTHETIC contracts only. A match means the same clause type and attributes as the human-reviewed fixture; "
          "the model's quotes are not compared. This reads clause FACTS only: flags, scores and verdicts still come from MeTTa.", "",
          "| Contract | Status | Matched | In fixture | Missed | Extra | Dropped (invalid vocabulary) | Seconds |", "|---|---|---|---|---|---|---|---|"]
    md += [f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {r[7]} |" for r in rows]
    md += ["", f"Overall: {total_ok} of {total_ref} fixture clauses reproduced.", ""]
    (ROOT / "docs" / "evidence" / "live-extract.md").write_text("\n".join(md), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
