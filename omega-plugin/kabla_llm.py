"""Kabla LLM provider plugin for Omega: works with no key, uses a real LLM when one is present.

Why it exists: Omega's stock providers all need a paid key, and its mock provider needs a test server we do
not have. Kabla's provider has two modes behind one name ("Kabla"):

  * live    - a key is in the environment (ANTHROPIC_API_KEY or OPENAI_API_KEY, loaded from the git-ignored .env):
              call the real model with Omega's tools. The model only READS and PHRASES; the Kabla skills
              (which call MeTTa) decide.
  * offline - no key, or the live call timed out / errored / the circuit is open: a small keyword router
              picks the right Kabla skill and phrases the result with a template. It is NOT an LLM and says so.

Safety nets (the user asked for these): hard wall-clock timeout per call, one retry, a circuit breaker that
stops hammering a dead endpoint for a cool-down, and automatic fall back to offline so the agent loop never
hangs or goes silent. Every decision is logged with a clear tag.

Nothing here logs or prints a key.
"""
from __future__ import annotations

import json
import logging
import os
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout

from providers import (LLMProvider, LLMRequest, LLMResponse, LLMToolCall,
                       LLMToolCallMessage, LLMToolCallResponseMessage, registerLLMProvider)

log = logging.getLogger("kabla_llm")

TIMEOUT_S = float(os.environ.get("OMEGA_LLM_TIMEOUT", "45"))     # whole call, including retry
FAILS_TO_OPEN = int(os.environ.get("OMEGA_LLM_FAILS", "3"))        # consecutive failures before cooling off
COOLDOWN_S = float(os.environ.get("OMEGA_LLM_COOLDOWN", "120"))    # how long the circuit stays open
OFFLINE_TAG = "[offline router, not an LLM]"

_SAMPLE = re.compile(r"\bc00[1-3]\b", re.I)


# ---------------------------------------------------------------- offline router
def _call(tool_name: str, request: LLMRequest, values: dict, n: int) -> LLMToolCall:
    """Build a tool call whose argument names match the tool Omega offered (validation is strict)."""
    tool = request.get_tool(tool_name)
    names = [p.name for p in tool.parameters] if tool else list(values)
    return LLMToolCall().with_name(tool_name).with_id(f"offline_{n}").with_arguments(
        {k: str(values.get(k, "")) for k in names})


def _last_user_text(request: LLMRequest) -> str:
    for m in reversed(request.messages):
        if getattr(m, "role", "") == "user" and not isinstance(m, (LLMToolCallMessage, LLMToolCallResponseMessage)):
            return str(m.content or "")
    return ""


def _prior_tool_result(request: LLMRequest) -> tuple[str, str]:
    """(name of the last tool called, its result text) from the transcript, or ('','')."""
    result, name = "", ""
    for m in reversed(request.messages):
        if isinstance(m, LLMToolCallResponseMessage) and not result:
            result = str(m.content or "")
        elif isinstance(m, LLMToolCallMessage) and m.calls:
            name = m.calls[-1].name or ""
            break
    return name, result


def offline_reply(request: LLMRequest, n: int = 0) -> LLMResponse:
    """Pick one Kabla skill for the user's message, or relay the last result. Deterministic."""
    text = _last_user_text(request)
    low = text.lower()
    resp = LLMResponse()
    prev_name, prev_result = _prior_tool_result(request)

    if low.startswith("[no new user input"):
        # The loop is idle. If a Kabla tool just returned something the user has not seen, relay it once.
        if prev_result and prev_name and prev_name not in ("send", "nop"):
            # Skills put a one-line DIGEST first (omega-plugin/kabla_skills.py); the result arrives inside a list
            # repr, so the line break shows up as a literal backslash-n.
            m = re.search(r"DIGEST: (.*?)(?:\\n|\n|'\]|$)", prev_result)
            body = m.group(1) if m else prev_result.replace("SUCCESS, RETURN:", "").strip()
            return resp.add_tool_call(_call("send", request, {"content": f"{OFFLINE_TAG} {body[:700]}"}, n))
        return resp.add_tool_call(_call("nop", request, {}, n))

    sample = _SAMPLE.search(text)
    if sample and re.search(r"why|sababu|kwa nini|explain|eleza", low):
        return resp.add_tool_call(_call("kabla-explain", request,
                                        {"contract_id": sample.group(0).lower(), "question": text[:300]}, n))
    if sample and re.search(r"analy|check|review|flag|chambua|angalia|scan", low):
        return resp.add_tool_call(_call("kabla-analyze", request, {"sample_id": sample.group(0).lower()}, n))
    if re.search(r"red ?line|never|usiruhusu|kamwe", low) and re.search(r"\bai\b|training|akili", low):
        return resp.add_tool_call(_call("kabla-redline-set", request,
                                        {"artist": "zawadi", "kind": "ai-training", "value": "never"}, n))
    if re.search(r"licen[cs]e|cleared|clear to|use of|sync|advert|\bad\b|leseni|tangazo", low):
        use = ("ai-training" if re.search(r"\bai\b|training", low)
               else "sync-film" if re.search(r"sync|film|movie", low) else "ad")
        return resp.add_tool_call(_call("kabla-licence", request,
                                        {"use": use, "territory": "KE", "months": "12", "party": "Demo Brand Ltd"}, n))
    help_text = (f"{OFFLINE_TAG} I can: analyse a synthetic contract (say 'analyse c001'), explain a flag "
                 "('why was c001 flagged'), set an AI-training red line, or check a licence use "
                 "('is a 12-month ad in Kenya cleared'). All data here is synthetic. "
                 "A real LLM will phrase answers more naturally once a key is configured.")
    return resp.add_tool_call(_call("send", request, {"content": help_text}, n))


# ---------------------------------------------------------------- live providers
def _tool_specs(request: LLMRequest, style: str) -> list[dict]:
    out = []
    for t in request.tools:
        props = {p.name: {"type": "string"} for p in t.parameters}
        schema = {"type": "object", "properties": props, "required": list(props)}
        if style == "openai":
            out.append({"type": "function", "function": {"name": t.name, "description": t.description or "", "parameters": schema}})
        else:
            out.append({"name": t.name, "description": t.description or "", "input_schema": schema})
    return out


def _post(url: str, headers: dict, body: dict, timeout: float) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"),
                                 headers={"content-type": "application/json", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def _openai_chat(request: LLMRequest, key: str, timeout: float) -> LLMResponse:
    msgs = []
    for m in request.messages:
        if isinstance(m, LLMToolCallResponseMessage):
            msgs.append({"role": "tool", "tool_call_id": m.callid, "content": str(m.content or "")})
        elif isinstance(m, LLMToolCallMessage):
            msgs.append({"role": "assistant", "content": None, "tool_calls": [
                {"id": c.id, "type": "function", "function": {"name": c.name, "arguments": json.dumps(c.arguments)}}
                for c in m.calls]})
        else:
            msgs.append({"role": m.role, "content": str(m.content or "")})
    base = os.environ.get("OMEGA_LLM_URL", "https://api.openai.com/v1").rstrip("/")
    body = {"model": os.environ.get("OMEGA_LLM_MODEL", "gpt-4o-mini"), "messages": msgs,
            "tools": _tool_specs(request, "openai"), "tool_choice": "required",
            "max_tokens": min(int(request.max_tokens or 1024), 2048)}
    data = _post(f"{base}/chat/completions", {"authorization": f"Bearer {key}"}, body, timeout)
    resp = LLMResponse()
    for c in (data["choices"][0]["message"].get("tool_calls") or []):
        args = json.loads(c["function"].get("arguments") or "{}")
        resp.add_tool_call(LLMToolCall().with_name(c["function"]["name"]).with_id(c["id"]).with_arguments(
            {k: v if isinstance(v, str) else json.dumps(v) for k, v in args.items()}))
    return resp


def _anthropic_chat(request: LLMRequest, key: str, timeout: float) -> LLMResponse:
    system, msgs = "", []
    for m in request.messages:
        if isinstance(m, LLMToolCallResponseMessage):
            msgs.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": m.callid, "content": str(m.content or "")}]})
        elif isinstance(m, LLMToolCallMessage):
            msgs.append({"role": "assistant", "content": [
                {"type": "tool_use", "id": c.id, "name": c.name, "input": c.arguments} for c in m.calls]})
        elif m.role == "system":
            system = str(m.content or "")
        else:
            msgs.append({"role": m.role, "content": str(m.content or "")})
    body = {"model": os.environ.get("OMEGA_LLM_MODEL", "claude-3-5-haiku-latest"), "system": system,
            "messages": msgs, "tools": _tool_specs(request, "anthropic"), "tool_choice": {"type": "any"},
            "max_tokens": min(int(request.max_tokens or 1024), 2048)}
    data = _post("https://api.anthropic.com/v1/messages",
                 {"x-api-key": key, "anthropic-version": "2023-06-01"}, body, timeout)
    resp = LLMResponse()
    for block in data.get("content", []):
        if block.get("type") == "tool_use":
            resp.add_tool_call(LLMToolCall().with_name(block["name"]).with_id(block["id"]).with_arguments(
                {k: v if isinstance(v, str) else json.dumps(v) for k, v in block.get("input", {}).items()}))
    return resp


# ---------------------------------------------------------------- the provider
class KablaProvider(LLMProvider):
    def __init__(self):
        self.fails = 0
        self.open_until = 0.0
        self.calls = 0
        self.pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="kabla-llm")

    def _key(self) -> tuple[str, str]:
        if os.environ.get("KABLA_OFFLINE_ONLY"):  # set by scripts/omega_run.py when .env has no real key
            return "", ""
        if os.environ.get("ANTHROPIC_API_KEY"):
            return "anthropic", os.environ["ANTHROPIC_API_KEY"]
        if os.environ.get("OPENAI_API_KEY"):
            return "openai", os.environ["OPENAI_API_KEY"]
        return "", ""

    def start(self) -> None:
        kind, _ = self._key()
        log.info("kabla_llm: %s", f"live provider = {kind} (falls back to offline on timeout/error)" if kind
                 else "no key set: OFFLINE router only (this is not an LLM)")

    def stop(self) -> None:
        self.pool.shutdown(wait=False, cancel_futures=True)

    def chat(self, request: LLMRequest) -> LLMResponse:
        self.calls += 1
        kind, key = self._key()
        if not kind:
            return offline_reply(request, self.calls)
        if time.time() < self.open_until:
            log.warning("kabla_llm: circuit open, offline for another %ds", int(self.open_until - time.time()))
            return offline_reply(request, self.calls)
        fn = _anthropic_chat if kind == "anthropic" else _openai_chat
        deadline = time.time() + TIMEOUT_S
        for attempt in (1, 2):
            left = deadline - time.time()
            if left <= 1:
                break
            try:
                # Wall-clock guard: a thread plus result(timeout) so a stalled socket cannot freeze the loop.
                res = self.pool.submit(fn, request, key, min(left, 30)).result(timeout=left)
                if res.calls:
                    self.fails = 0
                    return res
                raise RuntimeError("model returned no tool call")
            except (FutureTimeout, urllib.error.URLError, TimeoutError, RuntimeError, ValueError, KeyError) as e:
                # No key or body in the message: only the exception class and text.
                log.warning("kabla_llm: live call attempt %d failed (%s: %s)", attempt, type(e).__name__, str(e)[:160])
                time.sleep(min(2.0, max(0.0, deadline - time.time() - 1)))
        self.fails += 1
        if self.fails >= FAILS_TO_OPEN:
            self.open_until = time.time() + COOLDOWN_S
            log.error("kabla_llm: %d failures in a row, circuit open for %ds", self.fails, int(COOLDOWN_S))
        log.warning("kabla_llm: falling back to offline router for this turn")
        return offline_reply(request, self.calls)


def loadOmegaPlugin():
    registerLLMProvider("Kabla", KablaProvider())
