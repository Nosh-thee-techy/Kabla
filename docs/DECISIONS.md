# Decisions log

Dated decisions and every place where we had to correct a sketch from `docs/BUILD_SPEC.md`.
Newest entries at the bottom.

## 2026-10-19 — Starter BRIEF.md is stale

`BRIEF.md` (copied from `BASIXmarket-io/hackathon-starter`) lists 3 tracks and a different
deadline and judging weights. We follow the official Hacker Pack and BASIX.MARKET
announcements: **Track 4 (BASIX.MARKET Builds), Brief B (Managing originals: Art IP and
Music IP), stage: License.** BRIEF.md is kept unmodified for provenance.

## 2026-10-19 — Engine runtime: PeTTa on native Windows SWI-Prolog

- SWI-Prolog 10.0.2 (x64-win64) installed via winget. PeTTa (`trueagi-io/PeTTa`, MIT)
  runs natively: `swipl -q -s PeTTa/src/main.pl -- file1.metta file2.metta --silent`.
  `run.sh` is just a thin wrapper around that command, so the bridge calls `swipl`
  directly and works on Windows, Linux and macOS without `sh`.
- `--silent` (or `silent`/`-s`) suppresses the compiler trace. Results of `!(...)`
  expressions are printed at the end; `println!` prints immediately.
- Several `.metta` files can be passed and are loaded **in order** into the same `&self`.
  The bridge uses this: rule modules → per-request `facts.metta` → query file.
- Measured cost: ~1.2 s PeTTa startup, ~2 s for a rules+facts+query run. Acceptable for a
  subprocess-per-request bridge; no persistent process needed.

## 2026-10-19 — Fix to the §6.2 sketch: function names vs. result constructors

The sketch `(= (flag $c $n R-GRANT-01 red) (match ...))` does not work in PeTTa. Once a
symbol has an `=` definition, PeTTa treats it as a **function everywhere** and checks the
arity of every occurrence; using `flag` as a 4-ary data constructor in another clause
fails at load time with
`Domain error: function_input_arities(flag,[1,2]) expected, found 4`.

Fix: rule functions and result constructors use different names. Rules are
`(= (flags-of $c) (match &self (clause ...) (flag $c $n R-GRANT-01 red)))`, one `=` clause
per rule; `(collapse (flags-of c001))` gathers all flags. `flag` stays pure data.

## 2026-10-19 — Omega recon

- Upstream is `singnet/Omega` (Apache-2.0), pinned at `1a7624e`. Plugin API
  (`docs/reference-plugin-api.md`): a MeTTa module exposing `loadOmegaPlugin`, listed in
  `config/plugins.yaml` with `loader: metta`; skills are added with
  `(add-skill fn "description" (args))`. Examples: `plugins/workflow`, `plugins/openclaw`.
- Omega ships `mockprovider` and `mockchannel`, so plugin loading can be exercised without
  an LLM key. The full agent needs `janus-swi`, torch, chromadb and an LLM key. That is
  heavy on Windows, so Omega work is scheduled after the L0 product (fallback ladder §12).
- `lib_nal.metta` lives at the Omega repo root (not needed for P0).
