"""Probe the configured OpenAI-compatible endpoint with one forced tool call. Never prints the key.

Reads OPENAI_API_KEY / OMEGA_LLM_URL / OMEGA_LLM_MODEL from the git-ignored .env and shows only status,
latency and the tool call the model chose, so we know the live path works before the agent depends on it.
"""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from omega_run import load_env  # noqa: E402

env = load_env()
key = env.get("OPENAI_API_KEY", "")
base = env.get("OMEGA_LLM_URL", "https://api.openai.com/v1").rstrip("/")
model = sys.argv[1] if len(sys.argv) > 1 else env.get("OMEGA_LLM_MODEL", "gpt-4o-mini")
print(f"endpoint={base} model={model} key_set={bool(key)}")
body = {
    "model": model, "max_tokens": 300,
    "messages": [{"role": "user", "content": "Save a red line for zawadi: ai-training never."}],
    "tools": [{"type": "function", "function": {
        "name": "kabla-redline-set", "description": "Save an artist's red line",
        "parameters": {"type": "object", "properties": {"artist": {"type": "string"}, "topic": {"type": "string"},
                                                        "stance": {"type": "string"}}, "required": ["artist", "topic", "stance"]}}}],
    "tool_choice": "required",
}
req = urllib.request.Request(f"{base}/chat/completions", data=json.dumps(body).encode(), method="POST",
                             headers={"authorization": f"Bearer {key}", "content-type": "application/json"})
t = time.time()
try:
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read())
    msg = data["choices"][0]["message"]
    print(f"OK {time.time() - t:.1f}s tool_calls=", json.dumps(msg.get("tool_calls"))[:300], "| content=", str(msg.get("content"))[:120])
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code} after {time.time() - t:.1f}s:", e.read().decode()[:300])
except Exception as e:  # noqa: BLE001
    print(f"FAILED after {time.time() - t:.1f}s: {type(e).__name__}: {e}")
