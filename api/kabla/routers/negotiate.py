from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse

from kabla import store
from kabla.models import DecideRequest, NegoSession
from kabla.services.negotiator import decide, start, transcript

router = APIRouter(tags=["negotiate"])


@router.post("/contracts/{cid}/negotiate/start", response_model=NegoSession)
def negotiate_start(cid: str) -> NegoSession:
    contract = store.get_contract(cid)
    if not contract:
        raise HTTPException(404, "contract not found")
    return start(contract)


@router.post("/negotiations/{sid}/decide", response_model=NegoSession)
def negotiate_decide(sid: str, body: DecideRequest) -> NegoSession:
    session = store.get_negotiation(sid)
    if not session:
        raise HTTPException(404, "negotiation not found")
    if session["state"] != "open":
        raise HTTPException(409, f"session already {session['state']}")
    return decide(session, body)


@router.get("/negotiations/{sid}/ledger")
def negotiate_ledger(sid: str) -> dict:
    session = store.get_negotiation(sid)
    if not session:
        raise HTTPException(404, "negotiation not found")
    return {"id": sid, "state": session["state"], "ledger": session["ledger"],
            "unresolved": session.get("unresolved") or []}


@router.get("/negotiations/{sid}/transcript.md")
def negotiate_transcript(sid: str) -> PlainTextResponse:
    session = store.get_negotiation(sid)
    if not session:
        raise HTTPException(404, "negotiation not found")
    return PlainTextResponse(transcript(session), media_type="text/markdown")
