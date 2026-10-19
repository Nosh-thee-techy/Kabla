def test_seed_loads_red_lines_with_dates(fresh_store):
    lines = {r["kind"]: r for r in fresh_store.list_redlines("zawadi")}
    assert lines["ai-training"]["value"] == "never"
    assert lines["ai-training"]["set_on"] == "2026-10-19"
    assert lines["term-max-years"]["value"] == 7


def test_events_get_stable_ids(fresh_store):
    e1 = fresh_store.add_event("zawadi", "work-registered", "w-asali")
    e2 = fresh_store.add_event("zawadi", "ai-stance-set", "zawadi")
    assert (e1["id"], e2["id"]) == ("e-0001", "e-0002")
    assert [e["type"] for e in fresh_store.list_events("zawadi")] == ["work-registered", "ai-stance-set"]
