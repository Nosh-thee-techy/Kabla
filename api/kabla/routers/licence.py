from fastapi import APIRouter

from kabla import store
from kabla.models import LicenceRequest, LicenceVerdict, Redline, RedlineCreate
from kabla.services.licence import check
from kabla.store import today

router = APIRouter(tags=["licence"])

PRESETS = [
    {"id": "A", "label": "Kenyan soap advert",
     "request": {"work_id": "w-asali", "use": "ad", "territory": "KE", "months": 6, "party": "Nuru Soaps"}},
    {"id": "B", "label": "Train an AI model on the track",
     "request": {"work_id": "w-asali", "use": "ai-training", "territory": "WW", "months": 12, "party": "Nuru Labs"}},
    {"id": "C", "label": "Harlem exhibition film",
     "request": {"work_id": "w-asali", "use": "sync-film", "territory": "US", "months": 3,
                 "party": "Harlem exhibition (SYNTHETIC)"}},
]


@router.get("/licence/presets")
def presets() -> dict:
    return {"presets": PRESETS, "synthetic": True}


@router.post("/licence/check", response_model=LicenceVerdict)
def licence_check(body: LicenceRequest) -> LicenceVerdict:
    rid = f"r-{body.use}-{body.territory}-{body.months}"
    return check(body, rid)


@router.post("/redlines", response_model=Redline)
def set_redline(body: RedlineCreate) -> Redline:
    record = {"artist": body.artist, "kind": body.kind, "value": body.value,
              "set_on": today(), "said": body.said, "source": "kabla"}
    store.set_redline(body.artist, body.kind, record)
    if not store.has_event(body.artist, "ai-stance-set", body.artist) and body.kind == "ai-training":
        store.add_event(body.artist, "ai-stance-set", body.artist, {"value": body.value})
    return Redline(**record)


@router.get("/redlines/{artist}")
def list_redlines(artist: str) -> dict:
    return {"artist": artist, "redlines": store.list_redlines(artist)}
