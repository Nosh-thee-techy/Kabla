from fastapi import APIRouter, HTTPException

from kabla.models import VerifyRequest, WorkCreate
from kabla.services import samples
from kabla.services.financier import financier
from kabla.services.passport import issue, passport, register, tamper, verify

router = APIRouter(tags=["passport"])


@router.post("/works")
def register_work(body: WorkCreate) -> dict:
    try:
        return register(body)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc)) from exc


@router.post("/passport/{artist}/issue")
def issue_passport(artist: str, work_id: str = "w-asali") -> dict:
    try:
        return issue(artist, work_id)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.get("/passport/{artist}")
def get_passport(artist: str) -> dict:
    return passport(artist)


@router.get("/passport/{artist}/financier")
def financier_view(artist: str, work_id: str = "w-asali") -> dict:
    """Read-only rearrangement of owners, flags, stance, gaps and the existing score."""
    return financier(artist, work_id)


@router.post("/verify")
def verify_passport(body: VerifyRequest) -> dict:
    work_file = None
    if body.work_file_b64:
        import base64
        work_file = base64.b64decode(body.work_file_b64)
    return verify(body.certificate, body.ledger, work_file)


@router.post("/verify/tamper-demo")
def tamper_demo(body: VerifyRequest) -> dict:
    """Change one character of a certificate and verify — always red for the video."""
    if not body.certificate:
        raise HTTPException(422, "certificate required")
    mutated = tamper(body.certificate)
    result = verify(mutated, None)
    return {"mutated": mutated, **result}


@router.get("/works/{work_id}")
def get_work(work_id: str) -> dict:
    from kabla import store
    record = store.get_work(work_id)
    if not record:
        # catalog only, not yet registered
        return {**samples.work(work_id), "registered": False}
    return {**record, "registered": True}
