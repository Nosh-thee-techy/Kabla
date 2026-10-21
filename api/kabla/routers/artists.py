from fastapi import APIRouter, HTTPException

from kabla.models import ArtistCreate
from kabla.services import onboarding
from kabla.services.metta_bridge import EngineError

router = APIRouter(tags=["artists"])


@router.post("/artists")
def create_artist(body: ArtistCreate) -> dict:
    """Before stage. Needs the consent tick. Never contacts any platform."""
    try:
        return onboarding.create_profile(body)
    except onboarding.ConsentRequired as exc:
        raise HTTPException(400, str(exc)) from exc
    except EngineError as exc:
        raise HTTPException(503, f"The rule engine could not list your gaps: {exc}") from exc


@router.get("/artists/{artist_id}")
def get_artist(artist_id: str) -> dict:
    profile = onboarding.get_profile(artist_id)
    if profile is None:
        raise HTTPException(404, "No profile for this artist yet. Introduce yourself on the Before page first.")
    return profile


@router.get("/artists/{artist_id}/audience")
def get_artist_audience(artist_id: str) -> dict:
    """SELF-REPORTED audience numbers and a plain band. Never fetched from a platform, never in the Rights check."""
    return onboarding.get_audience(artist_id)


@router.get("/artists/{artist_id}/seal/verify")
def verify_artist_seals(artist_id: str) -> dict:
    return onboarding.verify_seals(artist_id)


@router.get("/artists/{artist_id}/profile.json")
def profile_metadata(artist_id: str) -> dict:
    """ERC-721-shaped metadata. Not minted anywhere in this build."""
    profile = onboarding.get_profile(artist_id)
    if profile is None:
        raise HTTPException(404, "No profile for this artist yet.")
    return profile["nft"]
