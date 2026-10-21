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
def _post(url: str, headers: dict, body: dict, timeout: float) -> dict:
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"),
                                 headers={"content-type": "application/json", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


PHRASE_SYSTEM = (
    "You are the desk assistant in Kabla, a contract tool for independent musicians and visual artists. "
    "Kabla's rule engine decides; you only rewrite its RESULT in plain, friendly words. Use ONLY facts in RESULT: "
    "add no numbers, clauses, advice or law. Keep every rule id (like R-AI-02) and contract id exactly as written. "
    "At most 4 short sentences. The data is synthetic. Reply with the text only.")
CHAT_SYSTEM = (
    "You are the desk assistant in Kabla, a contract tool for independent musicians and visual artists. You can "
    "only help with: analysing a synthetic contract (say 'analyse c001'), explaining a flag ('why was c001 "
    "flagged'), setting an AI-training red line, and checking a licence use ('is a 12-month ad in Kenya cleared'). "
    "Never judge a clause or give legal advice yourself. Greet briefly, say what you can do, 2 sentences at most. "
    "Reply with the text only.")


def _last_real_user(request: LLMRequest) -> str:
    """The user's actual question (skips the loop's idle prompts)."""
    for m in reversed(request.messages):
        if getattr(m, "role", "") == "user" and not isinstance(m, (LLMToolCallMessage, LLMToolCallResponseMessage)):
            t = str(m.content or "")
            if not t.lower().startswith("[no new user input"):
                return t
    return ""


def _digest_of(prev_result: str) -> str:
    """The skill's one-line DIGEST (or the whole result) without the list-repr noise."""
    m = re.search(r"DIGEST: (.*?)(?:\\n|\n|'\]|$)", prev_result)
    return m.group(1) if m else prev_result.replace("SUCCESS, RETURN:", "").strip()


_LEAK = re.compile(r"\bRESULT\b|^(we|i|let'?s|the user|okay|so)\s+(need|must|should|have|will|want|are|'ll|,)|rewrite|at most \d|rule id", re.I)


def _vet(out: str, grounding: str) -> str:
    """Accept the model's phrasing only if it is clean and grounded; else '' (caller relays the digest).

    Why: an open reasoning model sometimes answers with its own planning ("We need to rewrite the RESULT...") and
    swaps ASCII hyphens for look-alikes, which breaks rule ids. So: normalise dashes, reject text that echoes the
    instructions, and require every rule id and every number in the reply to appear in what the engine said.
    """
    out = re.sub("[\u2010-\u2015\u2212]", "-", out).replace("\u2019", "'").strip()
    if not out or _LEAK.search(out):
        return ""
    ids = r"R-[A-Z0-9]+(?:-[A-Z0-9]+)*"
    if set(re.findall(ids, grounding)) - set(re.findall(ids, out)):
        return ""                                   # dropped a rule id
    if set(re.findall(r"\d+", out)) - set(re.findall(r"\d+", grounding)):
        return ""                                   # invented a number
    return out


def _plain_chat(kind: str, key: str, system: str, user: str, timeout: float) -> str:
    """One tool-less completion. OpenAI-compatible (OMEGA_LLM_URL, e.g. OpenRouter) or Anthropic."""
    if kind == "anthropic":
        data = _post("https://api.anthropic.com/v1/messages", {"x-api-key": key, "anthropic-version": "2023-06-01"},
                     {"model": os.environ.get("OMEGA_LLM_MODEL", "claude-3-5-haiku-latest"), "system": system,
                      "max_tokens": 300, "messages": [{"role": "user", "content": user}]}, timeout)
        return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text").strip()
    base = os.environ.get("OMEGA_LLM_URL", "https://api.openai.com/v1").rstrip("/")
    body = {"model": os.environ.get("OMEGA_LLM_MODEL", "gpt-4o-mini"), "max_tokens": 300, "temperature": 0.2,
            "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}
    if "openrouter.ai" in base:
        # Reasoning models otherwise put their planning in the reply ("We need to rewrite the RESULT...") on about
        # half the calls; switching it off was faster and clean 6 of 6 in a probe. Only sent to OpenRouter: other
        # OpenAI-compatible servers may reject an unknown field.
        body["reasoning"] = {"enabled": False}
    data = _post(f"{base}/chat/completions", {"authorization": f"Bearer {key}"}, body, timeout)
    return str(data["choices"][0]["message"].get("content") or "").strip()


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
        """Hybrid turn. The router picks the Kabla skill (deterministic); the live model only PHRASES.

        Why not hand Omega's whole toolbox to the model: tried first (docs/evidence/omega-chat.md history in git):
        with an open Nemotron model the agent wandered (memory queries, pins, answers to the wrong message, one
        clarifying question for an unambiguous request) and replies lagged one turn behind. Kabla's promise is
        "MeTTa decides, the LLM reads and phrases", so the model is only asked to phrase.
          1. real user message, recognised intent -> the router's skill call (no model call at all)
          2. skill result waiting          -> the model rewrites the DIGEST in plain words; must keep every rule id
          3. real user message, no intent  -> the model answers briefly inside a fixed persona
          4. idle tick                     -> nop (Omega's loop spins every few seconds; no point paying for that)
        Any failure, timeout or open circuit -> the offline router for that turn.
        """
        self.calls += 1
        kind, key = self._key()
        if not kind:
            return offline_reply(request, self.calls)
        text = _last_user_text(request)
        idle = text.lower().startswith("[no new user input")
        prev_name, prev_result = _prior_tool_result(request)

        if idle:
            if not (prev_name.startswith("kabla-") and prev_result):
                return LLMResponse().add_tool_call(_call("nop", request, {}, self.calls))
            digest = _digest_of(prev_result)
            ask = _last_real_user(request)
            prompt = f"The user asked: {ask[:300]}\nRESULT (facts from Kabla's rule engine):\n{digest[:1500]}"
            raw = self._phrase(kind, key, PHRASE_SYSTEM, prompt)
            out = _vet(raw, digest + " " + ask)
            if out:
                return LLMResponse().add_tool_call(_call("send", request, {"content": out[:900]}, self.calls))
            if raw:
                log.warning("kabla_llm: model phrasing rejected (leak, dropped id or invented number); relaying the digest. Text: %r", raw[:160])
            return offline_reply(request, self.calls)

        routed = offline_reply(request, self.calls)
        if routed.calls and (routed.calls[0].name or "").startswith("kabla-"):
            log.info("kabla_llm: intent routed to %s (no model call)", routed.calls[0].name)
            return routed
        out = _vet(self._phrase(kind, key, CHAT_SYSTEM, text[:600]), "c001 c002 c003 " + text)
        if out:
            return LLMResponse().add_tool_call(_call("send", request, {"content": out[:900]}, self.calls))
        return routed

    def _phrase(self, kind: str, key: str, system: str, user: str) -> str:
        """One plain (no tools) completion with the whole-call timeout, one retry and the circuit breaker.
        Returns '' on failure so the caller falls back to the offline router."""
        if time.time() < self.open_until:
            log.warning("kabla_llm: circuit open, offline for another %ds", int(self.open_until - time.time()))
            return ""
        deadline = time.time() + TIMEOUT_S
        for attempt in (1, 2):
            left = deadline - time.time()
            if left <= 1:
                break
            try:
                # Wall-clock guard: a thread plus result(timeout) so a stalled socket cannot freeze the loop.
                out = self.pool.submit(_plain_chat, kind, key, system, user, min(left, 30)).result(timeout=left)
                if out:
                    self.fails = 0
                    return out
                raise RuntimeError("model returned no text")
            except (FutureTimeout, urllib.error.URLError, TimeoutError, RuntimeError, ValueError, KeyError) as e:
                # No key or body in the message: only the exception class and text.
                log.warning("kabla_llm: live call attempt %d failed (%s: %s)", attempt, type(e).__name__, str(e)[:160])
                time.sleep(min(2.0, max(0.0, deadline - time.time() - 1)))
        self.fails += 1
        if self.fails >= FAILS_TO_OPEN:
            self.open_until = time.time() + COOLDOWN_S
            log.error("kabla_llm: %d failures in a row, circuit open for %ds", self.fails, int(COOLDOWN_S))
        log.warning("kabla_llm: falling back to offline router for this turn")
        return ""


def loadOmegaPlugin():
    registerLLMProvider("Kabla", KablaProvider())
