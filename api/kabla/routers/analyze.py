from fastapi import APIRouter, HTTPException

from kabla import store
from kabla.models import Analysis, SimulateRequest, Simulation
from kabla.services.analyze import analyze
from kabla.services.simulate import simulate

router = APIRouter(tags=["analyze"])


@router.post("/contracts/{cid}/analyze", response_model=Analysis)
def analyze_contract(cid: str) -> Analysis:
    contract = store.get_contract(cid)
    if not contract:
        raise HTTPException(404, "contract not found")
    return analyze(contract)


@router.get("/contracts/{cid}/clauses")
def clauses(cid: str) -> dict:
    contract = store.get_contract(cid)
    if not contract:
        raise HTTPException(404, "contract not found")
    result = analyze(contract)
    return {"clauses": result.clauses, "clause_severity": result.clause_severity, "flags": result.flags}


@router.post("/contracts/{cid}/simulate", response_model=Simulation)
def simulate_contract(cid: str, body: SimulateRequest) -> Simulation:
    contract = store.get_contract(cid)
    if not contract:
        raise HTTPException(404, "contract not found")
    return simulate(contract, body.streams)
