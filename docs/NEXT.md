# What's next

Done since the first License-stage cut (see README "Honest status" for exact wording):
Before-stage onboarding (self-declared, consent-recorded, sealed), a real Omega agent loop running with Kabla's
plugin, a chat bridge, and a browser click-through of every room.

## Needs the team

- **Rotate the LLM key.** The OpenRouter key used for the 2026-10-21 live chat test was pasted into a chat window; replace it in `.env`
  and restart the API and `scripts/omega_run.py`. The agent chat is live (Nemotron 3 Super via OpenRouter, 5 of 5 turns) but the model only phrases.
- **Live contract reading is tried, and imperfect.** `KABLA_MODE=live` + `KABLA_LLM_URL` (set in `.env` on this machine) lets Nemotron read
  **pasted contract text**; MeTTa then flags it. Fed the three sample contracts as raw text it reproduced 24 of 30 reviewed fixture clauses
  (`docs/evidence/live-extract.md`, `python scripts/live_extract_check.py`): a few misses, some wrong numbers (e.g. a reversion of 2 instead of
  12 months), and one clause per contract dropped by the vocabulary check. A pasted 6-clause synthetic contract came back with five sensible flags.
  So live reading needs the roadmap's "please confirm this clause" step before anyone relies on it. A **pasted bio** is read by the regex reader, not a model.
  Without live mode, pasted text outside the three samples gets a plain 422 message and nothing is decided.
- **Let the model choose Omega's tools?** Tried first, with Nemotron: it wandered (answers to the previous message, memory queries instead of
  answers, one needless clarifying question). Kabla's provider now routes by keyword and uses the model only to phrase. A stronger model,
  or a tighter Omega prompt, may make full tool choice reliable; re-run `scripts/omega_smoke.py` to find out.
- **Fluent-speaker review** of every Swahili string (all AI-drafted, including the onboarding and agent-chat copy).
- **Public hosting** so judges can open the app without running it locally.
- **Organisers' answer** on synthetic-only data (see docs/DECISIONS.md).

## Known limits to fix next

- **State is kept per tab, not per person.** A reload keeps the open contract, analysis, profile and passport (sessionStorage); a new tab
  or visit starts clean at Before, and nothing is saved to an account. The browser check has a reload row (03b).
- **Typed profiles hold facts and gaps only.** The Passport, Financier and Verify rooms still run on the synthetic work
  "Asali ya Jioni"; a new artist's profile does not yet carry their own catalogue through those rooms.
- **Profile seals are a separate signed chain** from the passport ledger (the passport verifier expects certificates).
  Merge when the verifier takes more than one record kind.
- **Chat channel delivers the latest message per agent turn.** Two messages inside one 2-second turn collapse to the second.
- **Omega on Windows has no Landlock sandbox** and runs a staged copy with four documented patches
  (docs/DECISIONS.md). On Linux/Docker use Omega's own image and policy.
- **Weak spots of the e2e.** Rows 03 and 06 of docs/E2E.md are light checks; Karani's first-time card must be dismissed before a room can be clicked.

## Roadmap (unchanged in spirit)

- **Protect** stage: takedown / dispute pack from the same trail; real identity verification (not self-declared).
- **Earn** stage: a real BASIX marketplace listing of the ERC-721-shaped metadata; a small non-transferable ERC-721 on an EVM
  **testnet only** with Verify showing "on-chain hash matches" (deployer key in git-ignored `.env`; nothing deployed yet).
  A sketch exists: `contracts/KablaPassport.sol` (non-transferable, one token per certificate hash). `node scripts/compile_contract.mjs`
  compiles it with solc 0.8.26 (compile check only; its behaviour is **not** tested on any chain, it is unaudited, and it is not deployed).
- Chat for feature phones: Telegram / WhatsApp / USSD through Omega's channel plugins.
- Live extraction with a **"please confirm this clause"** check when confidence is low (NAL truth values `(stv f c)` as the signal).
