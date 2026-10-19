# Rights Passport

The passport is the **output of licensing**, not a separate product. It is
hash-sealed evidence of agreed terms. It is **not** a court-enforceable
instrument, a collecting-society registration, or a credit score.

## Certificate

1. Hash the work file (demo: placeholder bytes labelled PLACEHOLDER) with SHA-256.
2. Build `certificate.json` (see `api/kabla/services/passport.py`): work hash,
   artist consent flags (`consent_to_register` required; `consent_to_sell`
   separate and default false), collaborators, AI tools, terms, `prev_hash`.
3. Sign the canonical JSON with Ed25519 (PyNaCl). Demo keys are generated at
   `python -m kabla.cli init` and live in `var/keys/` (git-ignored).
4. Append a **hash-linked ledger** record:
   `record_hash = SHA-256(seq : payload_hash : prev_hash)`.
   Editing any past record breaks every later link.
5. Also emit ERC-721-shaped metadata (`name`, `description`, `attributes`,
   `properties.rights`) so a listing *could* be made. Nothing is minted.
   A phigital twin is a *reference* to the physical original, which never moves.

## Verify and the tamper test

`POST /verify` returns `intact` or `tampered: record N hash mismatch` (or
signature mismatch). The demo's **tamper test** changes one character of the
title; verification turns red and names the broken record.

## Badges (Open Badges v2 shape)

Issuer is **"Kabla (demo issuer, not BASIX)"**. Issued when the matching
verified event exists:

| Badge | Event |
|---|---|
| Read Before Signing | `contract-analysed` |
| AI-Training Locked | `ai-stance-set` |
| Splits Agreed | `splits-agreed` |
| Clean Deal | `contract-clean` |
| Fully Cleared | `licence-cleared` |

## Rights-health score (not credit)

A number 0–100 built only from **verified events** in this artist's log.
Never compares artists. A new artist starts at 0 with "next best steps".

| Event | Points |
|---|---|
| Work registered with hash and artist consent | +15 |
| All contributors listed | +10 |
| AI tools used are disclosed on the work | +10 |
| AI-training stance explicitly set | +10 |
| Splits agreed by every co-writer and total = 100% | +20 |
| Contract analysed and no unresolved red flags | +15 |
| Every licence granted has all required consents | +15 |
| Unresolved red flag in a signed contract | −5 each (floor 0) |
| Licence granted without a required consent | −10 each |

Weights are the constants in `engine/score.metta`. The UI ring's "Why this
number" drawer lists `event → points → clause or consent link`. Hand-checked
example: registering `w-asali` with Zawadi's red lines and confirmed splits
scores **65** (15+10+10+10+20).
