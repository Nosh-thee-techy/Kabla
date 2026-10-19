# Negotiation protocol

Kabla never agrees on the artist's behalf. Two rule-based agents trade moves;
the artist taps **Approve** or **Reject** on every concession.

## Roles

- **Artist agent** opens every red/amber flag, in a fixed order (AI / voice,
  grant, term, reversion, royalty, then the rest). Its ask comes from the
  artist's red lines where those exist (`never` AI, max 7 years) and otherwise
  from a fair default on the label's own ladder (e.g. 18% royalty).
- **Label agent** reads a **synthetic policy** in `data/policies/`. Each topic
  is a concession ladder: step 0 is the contract as written, the last step is
  the floor. The label concedes **at most one step per round** and never past
  the floor.
- **The artist** is the only one who can apply a concession.

## Moves

MeTTa `engine/negotiate.metta` returns one of:

| Move | Meaning |
|---|---|
| `accept` | Current ladder value already matches the ask. |
| `counter` | Next step toward the ask (still on the ladder, ≤ floor). |
| `reject` | Label is at its floor and the ask is still unmet. |

Each move carries the **policy line** it came from (e.g. "Mawingu policy 2.1 —
AI training: ask granted, floor opt-in per use, paid") and a piece of
**advice** (`concede`, `hold-redline`, `hold-flagged`, `standoff`, `walk-away`).
Advice is shown in the UI; it is never auto-applied.

## End states (max 4 rounds)

- **agreed** — every open topic closed (the artist accepted the label's last
  value, including yielding a red line if they chose to).
- **standoff** — rounds exhausted with topics still open. Kabla lists them and
  says "a lawyer should look at this".
- **walk-away** — the artist rejected a `reject` move on a **red line**. The
  standing rule is a hard stop.

## Worked example (c001 × Mawingu, SYNTHETIC)

Round 1, as written:

| Topic | Ask | Label step 0 | Move |
|---|---|---|---|
| AI training | `never` (red line, 19 Oct 2026) | `granted` | counter `opt-in-paid` |
| Voice | `promo-only` | `synthetic-voice` | counter `promo-only` |
| Grant | exclusive in Africa for the term | perpetual worldwide | counter `term-worldwide-exclusive` |
| Term | 7 years | perpetual | counter `10` |
| Royalty | 18% | 12% | counter `15` |

Zawadi approves the voice, grant, term and royalty steps. She can reject the
AI counter (her red line is `never`) — the session will not silently accept
opt-in for her.

If she later rejects the label's floor `reject` on AI training, the session
ends in **walk-away**. If she holds a non-redline topic (options) until round
4, the session ends in **standoff** and the transcript lists that clause.

The ordered ledger is saved on the session and exported as
`GET /negotiations/{id}/transcript.md`. A demo export lives in
`docs/transcripts/02-negotiation.md` after `python scripts/e2e_demo.py`.
