"""Before stage: consent gate, no scraping, visible reader, MeTTa gaps, sealed chain."""
from fastapi.testclient import TestClient

from kabla.main import app
from kabla.services import onboarding

client = TestClient(app)


def test_reader_finds_titles_splits_platforms_income():
    facts = onboarding.read_bio(
        'I release on Spotify and TikTok. "Pwani Moja" is 50% mine. I also wrote "Usiku Mrefu". '
        "Most money comes from live shows.")
    titles = {w["title"]: w for w in facts["works"]}
    assert titles["Pwani Moja"]["splits_stated"] is True and titles["Pwani Moja"]["share"] == 50
    assert titles["Usiku Mrefu"]["splits_stated"] is False
    assert facts["platforms"] == ["spotify", "tiktok"]
    assert "live shows" in facts["income_streams"]


def test_no_consent_no_profile(fresh_store):
    r = client.post("/artists", json={"name": "Neema", "consent": False})
    assert r.status_code == 400
    assert "consent" in r.json()["detail"].lower()
    assert client.get("/artists/neema").status_code == 404


def test_typed_profile_gets_gaps_from_metta_and_a_seal(fresh_store):
    r = client.post("/artists", json={
        "name": "Neema Achieng", "consent": True, "handles": {"Instagram": "@neema_demo"},
        "bio": 'My song "Mwanga" has no written split yet. I sell merch.'})
    assert r.status_code == 200, r.text
    p = r.json()
    assert p["id"] == "neema-achieng" and p["source"] == "typed by the artist"
    gap_ids = {g["id"] for g in p["gaps"]}
    assert {"splits-unstated", "ai-stance-unset"} <= gap_ids
    assert "no-handles" not in gap_ids
    assert p["seal"]["seq"] == 1 and p["nft"]["properties"]["certHash"] == p["seal"]["payload_hash"]
    assert client.get("/artists/neema-achieng/seal/verify").json()["intact"] is True


def test_demo_handle_loads_the_synthetic_fixture(fresh_store):
    p = client.post("/artists", json={"name": "x", "consent": True,
                                      "handles": {"instagram": "@zawadi_synth"}}).json()
    assert p["id"] == "zawadi" and "fixture" in p["source"]
    assert p["facts"]["works"][0]["title"] == "Asali ya Jioni"
    assert "ai-stance-unset" not in {g["id"] for g in p["gaps"]}  # Zawadi has a standing red line


def test_empty_profile_lists_every_basic_gap(fresh_store):
    p = client.post("/artists", json={"name": "Blank Person", "consent": True}).json()
    assert {"no-works-listed", "no-handles", "ai-stance-unset"} <= {g["id"] for g in p["gaps"]}


def test_reseal_extends_chain_and_tamper_is_caught(fresh_store):
    body = {"name": "Neema", "consent": True, "handles": {"tiktok": "@n"}}
    client.post("/artists", json=body)
    client.post("/artists", json=body)
    assert client.get("/artists/neema/seal/verify").json()["records"] == 2
    from kabla import store
    chain = store.seal_chain("neema")
    chain[0]["certificate"]["facts"]["works"] = [{"title": "Forged", "splits_stated": True}]
    with store.connect() as c:
        import json
        c.execute("UPDATE profile_seals SET body=? WHERE seq=(SELECT MIN(seq) FROM profile_seals WHERE artist=?)",
                  (json.dumps(chain[0]), "neema"))
    out = client.get("/artists/neema/seal/verify").json()
    assert out["intact"] is False and out["broken_at"] == 1


def test_no_network_in_onboarding_module():
    import inspect
    src = inspect.getsource(onboarding)
    assert "httpx" not in src and "requests" not in src and "urllib" not in src
