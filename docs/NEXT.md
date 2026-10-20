# What's next

Done since the first License-stage cut (see README "Honest status" for exact wording):
Before-stage onboarding (self-declared, consent-recorded, sealed), a real Omega agent loop running with Kabla's
plugin, a chat bridge, and a browser click-through of every room.

## Needs the team

- **LLM key.** Put `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env` and restart `scripts/omega_run.py`: the Omega agent then
  uses a real model (the offline keyword router is only a fallback). The same key enables `KABLA_MODE=live`, which is what
  reads **pasted contracts** and a **pasted bio** in free text. Without a key, pasted text outside the three samples gets a plain
  422 message and nothing is decided. Not yet tried end to end with a real key.
- **Fluent-speaker review** of every Swahili string (all AI-drafted, including the onboarding and agent-chat copy).
- **Public hosting** so judges can open the app without running it locally.
- **Organisers' answer** on synthetic-only data (see docs/DECISIONS.md).

## Known limits to fix next

- **State lives in memory.** A full page reload drops the open contract and the profile and sends the visitor back to Before.
  Fix: keep them in the URL or sessionStorage.
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
