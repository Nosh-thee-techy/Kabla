"""Ground a 'why?' question in a stored analysis trail. No new verdicts."""
from __future__ import annotations

import re

from kabla import store
from kabla.services.analyze import analyze


def answer(question: str, contract_id: str | None, lang: str = "en") -> dict:
    if not contract_id:
        return {"answer": "Name a contract id (c001, c002 or c003) so I can read its trail.",
                "trail": [], "grounded": False}
    contract = store.get_contract(contract_id)
    if not contract:
        return {"answer": f"No contract {contract_id} in the store. Analyse it from the Desk first.",
                "trail": [], "grounded": False}
    analysis = analyze(contract)
    nums = [int(n) for n in re.findall(r"\b(\d{1,2})\b", question)]
    flags = analysis.flags
    if nums:
        flags = [f for f in flags if f.clause in nums] or flags
    if "ai" in question.lower():
        flags = [f for f in flags if "AI" in f.rule_id] or flags
    chosen = flags[:3]
    lines = []
    for f in chosen:
        text = f.meaning_sw if lang == "sw" else f.meaning_en
        extra = f.trail[-1].text_sw if lang == "sw" else f.trail[-1].text_en
        lines.append(f"{f.rule_id} (clause {f.clause}): {text} {extra}")
    if not lines:
        return {"answer": "MeTTa raised no flags on that contract.", "trail": [], "grounded": True}
    return {"answer": " ".join(lines), "trail": [t.model_dump() for f in chosen for t in f.trail],
            "grounded": True, "rule_ids": [f.rule_id for f in chosen]}
