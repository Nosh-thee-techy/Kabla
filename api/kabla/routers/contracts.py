"""/samples and /contracts."""
from __future__ import annotations

import hashlib

from fastapi import APIRouter, HTTPException

from kabla import store
from kabla.models import Contract, ContractCreate
from kabla.services import samples

router = APIRouter(tags=["contracts"])


@router.get("/samples")
def list_samples() -> dict:
    return {"contracts": samples.list_samples(), "artists": samples.list_artists(), "synthetic": True}


@router.post("/contracts", response_model=Contract)
def create_contract(body: ContractCreate) -> Contract:
    sample_id = body.sample_id
    if sample_id and sample_id not in samples.SAMPLE_FILES:
        raise HTTPException(404, f"unknown sample {sample_id}")
    if not sample_id:
        if not body.text or not body.text.strip():
            raise HTTPException(422, "give a sample_id or contract text")
        sample_id = samples.match_sample(body.text)
    if sample_id:
        fx = samples.fixture(sample_id)
        text = samples.contract_text(sample_id)
        record = {"id": sample_id, "sample_id": sample_id, "title": samples.contract_title(text), "text": text,
                  "artist": body.artist, "kind": fx["kind"], "label": fx["parties"]["label"]}
    else:
        cid = "u-" + hashlib.sha256(body.text.encode("utf-8")).hexdigest()[:8]
        record = {"id": cid, "sample_id": None, "title": samples.contract_title(body.text), "text": body.text,
                  "artist": body.artist, "kind": body.kind, "label": body.label}
    store.put_contract(record)
    return Contract(**record)


@router.get("/contracts/{cid}", response_model=Contract)
def get_contract(cid: str) -> Contract:
    record = store.get_contract(cid)
    if not record:
        raise HTTPException(404, "contract not found")
    return Contract(**record)
