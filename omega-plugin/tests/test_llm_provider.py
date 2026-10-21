"""The Kabla LLM provider must never hang or go silent: offline routing, timeout fallback, circuit breaker.

Omega's own `providers` module is stubbed here (same class and method names) so these tests run in the plain API
venv without Omega's heavy dependencies. The real classes were exercised in the live agent run
(docs/evidence/omega-chat.md).
"""
import importlib.util
import sys
import time
import types
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]


def _stub_providers():
    m = types.ModuleType("providers")

    class Msg:
        def __init__(self, role="user", content=""):
            self.role, self.content = role, content

    class ToolCallMsg(Msg):
        def __init__(self, calls):
            super().__init__("assistant", "[TOOL CALL]")
            self.calls = calls

    class ToolRespMsg(Msg):
        def __init__(self, content, callid="x"):
            super().__init__("tool", content)
            self.callid = callid

    class Param:
        def __init__(self, name):
            self.name = name

    class Tool:
        def __init__(self, name, params=()):
            self.name, self.description, self.parameters = name, "", [Param(p) for p in params]

    class Call:
        def __init__(self):
            self.name = self.id = self.error = None
            self.arguments = {}

        def with_name(self, n): self.name = n; return self
        def with_id(self, i): self.id = i; return self
        def with_arguments(self, a): self.arguments = a; return self

    class Req:
        def __init__(self, messages, tools):
            self.messages, self.tools, self.max_tokens = messages, tools, 500
            self._by = {t.name: t for t in tools}

        def get_tool(self, n): return self._by.get(n)
        def has_tool(self, n): return n in self._by

    class Resp:
        def __init__(self):
            self.calls, self.error = [], None

        def add_tool_call(self, c): self.calls.append(c); return self

    class Provider:
        pass

    m.LLMProvider, m.LLMRequest, m.LLMResponse, m.LLMToolCall = Provider, Req, Resp, Call
    m.LLMToolCallMessage, m.LLMToolCallResponseMessage = ToolCallMsg, ToolRespMsg
    m.registerLLMProvider = lambda *_a, **_k: None
    m._Msg, m._Tool = Msg, Tool
    return m


@pytest.fixture()
def kl(monkeypatch):
    prov = _stub_providers()
    monkeypatch.setitem(sys.modules, "providers", prov)
    spec = importlib.util.spec_from_file_location("kabla_llm_under_test", ROOT / "kabla_llm.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    for k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "KABLA_OFFLINE_ONLY"):
        monkeypatch.delenv(k, raising=False)
    mod._prov = prov
    return mod


def _req(kl, text):
    p = kl._prov
    tools = [p._Tool("kabla-analyze", ["sample_id"]), p._Tool("kabla-licence", ["use", "territory", "months", "party"]),
             p._Tool("kabla-redline-set", ["artist", "kind", "value"]), p._Tool("kabla-explain", ["contract_id", "question"]),
             p._Tool("send", ["content"]), p._Tool("nop", [])]
    return p.LLMRequest([p._Msg("system", "s"), p._Msg("user", text)], tools)


def test_offline_router_picks_the_right_skill(kl):
    cases = {"please analyse c002": "kabla-analyze", "why was c001 flagged": "kabla-explain",
             "never allow ai training": "kabla-redline-set", "is a 12 month ad cleared": "kabla-licence",
             "hello": "send", "[NO NEW USER INPUT. CONTINUE]": "nop"}
    for text, tool in cases.items():
        assert kl.offline_reply(_req(kl, text)).calls[0].name == tool, text


def test_arguments_match_the_offered_tool(kl):
    call = kl.offline_reply(_req(kl, "is a sync film use cleared")).calls[0]
    assert set(call.arguments) == {"use", "territory", "months", "party"} and call.arguments["use"] == "sync-film"


def test_relays_a_digest_once_then_idles(kl):
    p = kl._prov
    req = _req(kl, "[NO NEW USER INPUT. CONTINUE]")
    req.messages = [p._Msg("system", "s"),
                    p.LLMToolCallMessage([p.LLMToolCall().with_name("kabla-analyze").with_id("a")]),
                    p.LLMToolCallResponseMessage("SUCCESS, RETURN: ['DIGEST: c001: 8 flags\\n{}']"),
                    p._Msg("user", "[NO NEW USER INPUT. CONTINUE]")]
    call = kl.offline_reply(req).calls[0]
    assert call.name == "send" and "c001: 8 flags" in call.arguments["content"]
    assert "not an LLM" in call.arguments["content"]  # the fallback never poses as a model


def test_no_key_means_offline_and_no_network(kl, monkeypatch):
    monkeypatch.setattr(kl, "_plain_chat", lambda *a, **k: pytest.fail("network used without a key"))
    assert kl.KablaProvider().chat(_req(kl, "hello")).calls[0].name == "send"


def test_slow_live_call_falls_back_within_the_budget(kl, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-not-real")
    monkeypatch.setattr(kl, "TIMEOUT_S", 3.0)
    monkeypatch.setattr(kl, "_plain_chat", lambda *a, **k: time.sleep(30))
    t0 = time.time()
    res = kl.KablaProvider().chat(_req(kl, "hello"))
    assert time.time() - t0 < 6 and res.calls[0].name == "send"  # answered offline, did not hang


def test_circuit_opens_after_repeated_failures(kl, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-not-real")
    monkeypatch.setattr(kl, "FAILS_TO_OPEN", 2)
    monkeypatch.setattr(kl, "TIMEOUT_S", 4.0)
    calls = {"n": 0}

    def boom(*a, **k):
        calls["n"] += 1
        raise ValueError("endpoint down")

    monkeypatch.setattr(kl, "_plain_chat", boom)
    prov = kl.KablaProvider()
    prov.chat(_req(kl, "hello"))
    prov.chat(_req(kl, "hello"))
    assert prov.open_until > time.time()
    seen = calls["n"]
    prov.chat(_req(kl, "hello"))
    assert calls["n"] == seen  # circuit open: the dead endpoint is not called again


def _pending_result_req(kl, ask, digest):
    """Transcript shape when a Kabla skill has just returned and the loop is idle again."""
    p = kl._prov
    req = _req(kl, "x")
    req.messages = [p._Msg("system", "s"), p._Msg("user", ask),
                    p.LLMToolCallMessage([p.LLMToolCall().with_name("kabla-explain").with_id("a")]),
                    p.LLMToolCallResponseMessage(f"SUCCESS, RETURN: ['DIGEST: {digest}\\n{{}}']"),
                    p._Msg("user", "[NO NEW USER INPUT. CONTINUE]")]
    return req


def test_recognised_intent_needs_no_model_call(kl, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-not-real")
    monkeypatch.setattr(kl, "_plain_chat", lambda *a, **k: pytest.fail("model called for a routed intent"))
    assert kl.KablaProvider().chat(_req(kl, "analyse c001")).calls[0].name == "kabla-analyze"  # the router picks the skill


def test_model_phrases_a_result_but_must_keep_the_rule_id(kl, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-not-real")
    digest = "R-AI-02 (clause 8): open-ended AI wording"
    monkeypatch.setattr(kl, "_plain_chat", lambda *a, **k: "Clause 8 (R-AI-02) is open-ended about AI use.")
    call = kl.KablaProvider().chat(_pending_result_req(kl, "why?", digest)).calls[0]
    assert call.name == "send" and "R-AI-02" in call.arguments["content"] and "not an LLM" not in call.arguments["content"]
    # A model that drops the rule id is not trusted: the digest is relayed instead, labelled as offline.
    monkeypatch.setattr(kl, "_plain_chat", lambda *a, **k: "Looks fine to me.")
    call = kl.KablaProvider().chat(_pending_result_req(kl, "why?", digest)).calls[0]
    assert "R-AI-02" in call.arguments["content"] and "not an LLM" in call.arguments["content"]


def test_idle_ticks_cost_nothing(kl, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-not-real")
    monkeypatch.setattr(kl, "_plain_chat", lambda *a, **k: pytest.fail("model called on an idle tick"))
    assert kl.KablaProvider().chat(_req(kl, "[NO NEW USER INPUT. CONTINUE]")).calls[0].name == "nop"


def test_vet_rejects_leaks_and_inventions_and_fixes_dashes(kl):
    g = "R-LIC-OK: cleared for Kenya, 12 months"
    assert kl._vet("We need to rewrite the RESULT in plain words.", g) == ""        # model echoing its instructions
    assert kl._vet("Cleared for Kenya for 24 months (R-LIC-OK).", g) == ""         # invented number
    assert kl._vet("Cleared for Kenya, 12 months.", g) == ""                       # dropped the rule id
    ok = kl._vet("Cleared for Kenya, 12 months (R\u2011LIC\u2011OK).", g)         # look-alike hyphens normalised
    assert ok == "Cleared for Kenya, 12 months (R-LIC-OK)."
