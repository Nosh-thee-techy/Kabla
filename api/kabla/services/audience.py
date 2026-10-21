"""Audience signals: numbers the musician TYPES about their own audience.

What this is: a small, fixed, readable calculation over SELF-REPORTED, UNVERIFIED numbers.
What it never does: open, fetch or scrape Instagram, TikTok, Facebook, Spotify or YouTube
(that breaks their terms and needs the owner's consent and official API access), or touch the
Rights check score. It says nothing about money or creditworthiness.

The band is plain arithmetic with illustrative thresholds, written down here and in docs/DECISIONS.md.
No language model computes any of it.
"""
from __future__ import annotations

from pydantic import BaseModel, Field

LABEL = "Self-reported, not verified. Not a credit score. It says nothing about money."

# Platforms the musician may type a number for. Spotify is monthly listeners, YouTube is subscribers.
FOLLOWER_PLATFORMS = ("instagram", "tiktok", "facebook", "spotify", "youtube")
# Likes come from posts on these, so the engagement rate divides by their followers only.
SOCIAL_PLATFORMS = ("instagram", "tiktok", "facebook", "youtube")

# ---- Illustrative thresholds (not market data, not a lender's rule) -----------------------------
GROWING_REACH = 1_000          # total reach at or above this -> "Growing"
GROWING_REACH_WITH_ENGAGEMENT = 500   # ... or this much if engagement is strong
STRONG_ENGAGEMENT_PCT = 5.0    # likes per post / followers, in percent
ESTABLISHED_REACH = 10_000     # total reach at or above this -> "Established"
LOW_ENGAGEMENT_PCT = 1.0       # below this, a big reach is held at "Growing"

MAX_NUMBER = 2_000_000_000


class AudienceInput(BaseModel):
    """What the musician types. Every field is optional."""
    followers: dict[str, int] = Field(default_factory=dict)
    avg_likes: int | None = Field(default=None, ge=0, le=MAX_NUMBER)
    note: str = Field(default="", max_length=300)


def clean_followers(raw: dict[str, int]) -> dict[str, int]:
    """Keep only known platforms with a number above zero, within a sane range."""
    out: dict[str, int] = {}
    for platform, value in raw.items():
        key = platform.strip().lower()
        if key in FOLLOWER_PLATFORMS and 0 < int(value) <= MAX_NUMBER:
            out[key] = int(value)
    return out


def summarise(followers: dict[str, int], avg_likes: int | None) -> dict:
    """Deterministic reading of the typed numbers. Returns codes and numbers; the page phrases them."""
    total = sum(followers.values())
    social = sum(v for k, v in followers.items() if k in SOCIAL_PLATFORMS)
    rate: float | None = None
    check_numbers = False
    if avg_likes is not None and avg_likes > 0 and social > 0:
        raw_rate = avg_likes / social * 100
        if raw_rate > 100:
            check_numbers = True      # more likes per post than followers: do not show a rate
        else:
            rate = round(raw_rate, 1)

    capped = False
    if total <= 0:
        band = "none"
    elif total >= ESTABLISHED_REACH:
        if rate is not None and rate < LOW_ENGAGEMENT_PCT:
            band, capped = "growing", True
        else:
            band = "established"
    elif total >= GROWING_REACH or (
        total >= GROWING_REACH_WITH_ENGAGEMENT and rate is not None and rate >= STRONG_ENGAGEMENT_PCT
    ):
        band = "growing"
    else:
        band = "starting"

    return {
        "total_reach": total,
        "social_followers": social,
        "engagement_rate_pct": rate,
        "check_numbers": check_numbers,
        "band": band,                      # none | starting | growing | established
        "held_back_by_engagement": capped,
        "thresholds": {
            "growing_reach": GROWING_REACH,
            "growing_reach_with_engagement": GROWING_REACH_WITH_ENGAGEMENT,
            "strong_engagement_pct": STRONG_ENGAGEMENT_PCT,
            "established_reach": ESTABLISHED_REACH,
            "low_engagement_pct": LOW_ENGAGEMENT_PCT,
        },
        "self_reported": True,
        "verified": False,
        "label": LABEL,
    }


def build(body: AudienceInput | None) -> dict | None:
    """The stored shape: what was typed, plus the reading. None when nothing was typed."""
    if body is None:
        return None
    followers = clean_followers(body.followers)
    if not followers and not body.avg_likes and not body.note.strip():
        return None
    return {
        "followers": followers,
        "avg_likes": body.avg_likes or None,
        "note": body.note.strip(),
        "summary": summarise(followers, body.avg_likes),
    }
