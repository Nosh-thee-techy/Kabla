# Limitations

Kabla is a hackathon build of the **License** stage. Please read this before relying on
anything it says.

## Not legal advice

- Kabla is not a lawyer and does not give legal advice. It points at clauses that commonly
  hurt artists and explains why, with the rule and clause behind every statement, so the
  artist (or a lawyer) can check it.
- The Rights Passport certificate is **evidence of agreed terms**, hash-sealed and signed by
  a demo key. It is not a court-enforceable instrument and not a registration with any
  collecting society or copyright office.

## The rights-health score

- It is **not a credit score, lending score or ranking**. It never compares artists with each
  other and never penalises a new artist: everyone starts at 0 with "next best steps".
- Every point is traced to a verified event in the artist's own log; weights are documented
  constants in `docs/PASSPORT.md`.

## Numbers

- The earnings simulator uses **illustrative synthetic rate profiles**, not market data.
  It shows the *shape* of a deal (royalty rate, recoupment, cross-collateralisation), not a
  forecast.
- We do not state statistics about how common predatory deals are.

## Language

- Swahili text is produced from reviewed templates, not live translation, and should be
  checked by a fluent speaker before real-world use. Still unchecked: the four pre-sign
  checklist labels/warnings and the deal-fairness line (`fair on` / `sawa katika`).

## Data

- Every contract, artist, label, work and amount is **SYNTHETIC**. No real partner data
  (Incantio, HFAS, Harlem CLxR, AI for Peace) and no real music or art files are used.
  "Work files" are tiny generated placeholder bytes.

## Extraction

- In deterministic mode clause facts come from hand-checked fixtures. In live mode an LLM
  extracts them and can be wrong; an extraction error would flow into the rules. The UI
  shows the source clause next to every fact so the artist can challenge it. Next step:
  "please confirm this clause" when confidence is low (NAL truth values).

## Engineering

- Single-user demo: SQLite file store, no authentication, demo signing keys generated at
  setup and kept out of git.
- No blockchain deployment. The certificate metadata is ERC-721-shaped so it *could* be
  listed, but nothing is minted on any network.
