"""Before stage: register a work and read audience signals with NO contract analysed first."""
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from kabla.main import app
from kabla.services import audience
from kabla.services.audience import AudienceInput, summarise

# ---- work-level registration, no contract -------------------------------------------------------


def test_work_check_needs_no_contract(fresh_store):
    r = TestClient(app).get("/works/w-asali/check", params={"artist": "zawadi"})
    assert r.status_code == 200
    body = r.json()
    assert body["title"] == "Asali ya Jioni" and body["synthetic"] is True
    assert body["registered"] is False
    assert body["composition_total"] == 100
    assert {o["person"] for o in body["owners"]} == {"zawadi", "baraka"}
    assert all(o["confirmed"] for o in body["owners"])
    assert body["ai_stance"]["value"] == "never"
    keys = {c["key"]: c["ok"] for c in body["checklist"]}
    assert keys == {"red-lines": True, "ai-stance": True, "splits": True, "consents": True}
    assert body["label"] == "rights-health, not credit"


def test_work_check_unknown_work_is_404(fresh_store):
    assert TestClient(app).get("/works/w-nope/check").status_code == 404


def test_register_and_issue_before_any_contract(fresh_store):
    client = TestClient(app)
    assert fresh_store.list_contracts() == []          # nothing analysed yet
    reg = client.post("/works", json={"work_id": "w-asali", "consent_to_register": True})
    assert reg.status_code == 200
    assert client.get("/works/w-asali/check").json()["registered"] is True

    issued = client.post("/passport/zawadi/issue").json()
    assert issued["certificate"]["label"].startswith("SYNTHETIC")
    assert issued["score"]["label"] == "rights-health, not credit"
    names = {b["badge"]["name"] for b in issued["badges"]}
    assert {"Splits Agreed", "AI-Training Locked"} <= names
    assert "Read Before Signing" not in names           # that stamp needs a contract read
    total = issued["score"]["score"]
    assert total == 65                                  # the Rights check does not wait for a contract
    assert sum(r["points"] for r in issued["score"]["reasons"]) == total
    assert client.post("/verify", json={"ledger": client.get("/passport/zawadi").json()["ledger"]}).json()["intact"]


def test_contract_stage_adds_its_stamp_later_without_lowering_the_check(fresh_store):
    client = TestClient(app)
    client.post("/works", json={"work_id": "w-asali", "consent_to_register": True})
    before = client.post("/passport/zawadi/issue").json()
    client.post("/contracts", json={"sample_id": "c003"})
    client.post("/contracts/c003/analyze")
    after = client.get("/passport/zawadi").json()
    assert after["score"]["score"] >= before["score"]["score"]
    assert "Read Before Signing" in {b["badge"]["name"] for b in after["badges"]}


# ---- audience signals: pure function ------------------------------------------------------------


def test_band_from_reach_only():
    assert summarise({}, None)["band"] == "none"
    assert summarise({"instagram": 200}, None)["band"] == "starting"
    assert summarise({"instagram": 600, "tiktok": 399}, None)["band"] == "starting"
    assert summarise({"instagram": 600, "tiktok": 400}, None)["band"] == "growing"
    assert summarise({"tiktok": 9_999}, None)["band"] == "growing"
    assert summarise({"tiktok": 10_000}, None)["band"] == "established"


def test_engagement_rate_only_when_both_given():
    s = summarise({"instagram": 2_000}, None)
    assert s["engagement_rate_pct"] is None
    assert summarise({"instagram": 2_000}, 0)["engagement_rate_pct"] is None
    assert summarise({"spotify": 5_000}, 100)["engagement_rate_pct"] is None   # listeners are not followers
    s = summarise({"instagram": 2_000}, 100)
    assert s["engagement_rate_pct"] == 5.0
    assert s["total_reach"] == 2_000 and s["self_reported"] is True and s["verified"] is False


def test_engagement_can_lift_or_hold_back_a_band():
    assert summarise({"instagram": 500}, 25)["band"] == "growing"           # 5% on 500 followers
    assert summarise({"instagram": 500}, 10)["band"] == "starting"          # 2% is not enough
    low = summarise({"instagram": 20_000}, 50)                              # 0.25% on a big audience
    assert low["band"] == "growing" and low["held_back_by_engagement"] is True
    assert summarise({"instagram": 20_000}, 2_000)["band"] == "established"
    assert summarise({"instagram": 20_000}, None)["band"] == "established"


def test_more_likes_than_followers_shows_no_rate():
    s = summarise({"instagram": 100}, 500)
    assert s["engagement_rate_pct"] is None and s["check_numbers"] is True


def test_build_keeps_only_known_platforms_and_positive_numbers():
    typed = audience.build(AudienceInput(followers={"Instagram": 1200, "myspace": 5, "tiktok": 0}, note="  hi "))
    assert typed["followers"] == {"instagram": 1200}
    assert typed["note"] == "hi"
    assert audience.build(AudienceInput()) is None
    assert audience.build(None) is None
    with pytest.raises(ValidationError):
        AudienceInput(avg_likes=-1)


# ---- audience signals through the API -----------------------------------------------------------


def _profile(**extra):
    return {"name": "Zawadi", "handles": {"instagram": "@zawadi_synth"}, "consent": True,
            "bio": "Singer in Nairobi. \"Asali ya Jioni\" is 60% mine.", **extra}


def test_audience_is_saved_with_the_profile_and_read_back(fresh_store):
    client = TestClient(app)
    made = client.post("/artists", json=_profile(audience={
        "followers": {"instagram": 4200, "tiktok": 800, "spotify": 1500}, "avg_likes": 150, "note": "Mostly Nairobi"}))
    assert made.status_code == 200
    got = client.get("/artists/zawadi/audience").json()
    a = got["audience"]
    assert got["self_reported"] is True and got["verified"] is False
    assert a["followers"] == {"instagram": 4200, "tiktok": 800, "spotify": 1500}
    assert a["summary"]["total_reach"] == 6500
    assert a["summary"]["band"] == "growing"
    assert a["summary"]["engagement_rate_pct"] == 3.0       # 150 / (4200 + 800)
    assert "credit" in got["label"].lower()
    assert client.get("/artists/zawadi/seal/verify").json()["intact"] is True


def test_audience_never_changes_the_rights_check(fresh_store):
    from kabla.services.scoring import score
    client = TestClient(app)
    client.post("/works", json={"work_id": "w-asali", "consent_to_register": True})
    client.post("/passport/zawadi/issue")
    before = score("zawadi")
    client.post("/artists", json=_profile(audience={"followers": {"instagram": 900_000}, "avg_likes": 50_000}))
    assert score("zawadi") == before


def test_old_profiles_without_audience_still_work(fresh_store):
    client = TestClient(app)
    client.post("/artists", json=_profile())                  # no audience at all
    stored = fresh_store.get_profile("zawadi")
    assert "audience" not in stored                           # shape unchanged for old data
    got = client.get("/artists/zawadi/audience").json()
    assert got["audience"] is None and got["verified"] is False
    assert client.get("/artists/nobody/audience").json()["audience"] is None
    assert client.get("/artists/zawadi/seal/verify").json()["intact"] is True


def test_audience_rejects_bad_numbers(fresh_store):
    client = TestClient(app)
    r = client.post("/artists", json=_profile(audience={"followers": {"instagram": "lots"}}))
    assert r.status_code == 422
    r = client.post("/artists", json=_profile(audience={"avg_likes": -3}))
    assert r.status_code == 422
