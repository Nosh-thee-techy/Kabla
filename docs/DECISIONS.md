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
- Omega's documented install path is Ubuntu (apt build-essential, python3-dev, janus-swi)
  or Docker (`singularitynet/omega` image). Plan: attempt plugin load in WSL/Docker after
  P0, record the result here, and state the real status in README.

## 2026-10-19 — PeTTa builtins verified for the engine design

Prototyped before writing rules (all confirmed on PeTTa `fea8317`):
`!(import! &self ./sub/mod.metta)` resolves relative to the importing file;
recursive rules over `match` (region containment KE ⊂ EA ⊂ AF ⊂ WW) work;
`collapse`, `foldl-atom` with an inline lambda, `size-atom`, `is-member`, `car-atom`,
`let*`, `and`, `max`, float arithmetic all work. Booleans print as `true`/`false`.
Symbols such as `R-GRANT-01`, `12-percent` and `2026-10-19` stay symbols.

Output convention: every query is `!(result <tag> <values...>)`; `result` is never
defined as a function, so PeTTa evaluates the arguments and prints the whole expression.
The bridge ignores any line that does not start with `(result `.

## 2026-10-19 — PeTTa stdout encoding on Windows

`swipl` on Windows may emit Latin-1 (byte `0xA7` for `§`) even when source files are UTF-8.
The bridge (`metta_bridge.py`) therefore decodes PeTTa stdout as UTF-8, then cp1252, then
Latin-1, so clause refs like `"c003-§6"` round-trip on every platform.

## 2026-10-19 — R-VOICE-01 narrowed to synthetic voice

The §6.2 sketch fires R-VOICE-01 on `(voice-likeness granted $x)` for any `$x`. That
would flag c003's "name and approved photographs only to promote the Recordings", which
is standard and fair, and Kabla must not cry wolf. R-VOICE-01 fires on
`synthetic-voice` only; `promo-only` is recorded but not flagged.

## 2026-10-19 — Task runner instead of bare make

The dev machine is Windows without `make`. `Makefile` targets delegate to
`scripts/tasks.py`, so `make test` (Linux/macOS/CI) and `python scripts/tasks.py test`
(Windows) do the same thing.

## 2026-10-19 — Omega not loaded; L0 is the product

Plugin sources (`omega-plugin/kabla_plugin.metta`, Python HTTP helpers) are in the
repo and define `loadOmegaPlugin` plus four skills. They have **not** been loaded
in a live Omega agent here. README, health endpoint and `scripts/setup_omega.py`
all say **MeTTa on PeTTa**. Docker Compose does not start Omega.

## 2026-10-19 — setuptools forbids api/../README.md

`api/pyproject.toml` pointed `readme` at `../README.md`. A clean clone then
failed `pip/uv install -e api` because setuptools will not read files outside
the package directory. The project README stays at the repo root; the package
metadata no longer references it.

## 2026-10-19 — Passport terms vs standing red lines

Issuing a passport used to copy the artist's red line value `never` into
`terms.ai_training`. The licence engine only understands `opt-in-paid` /
`prohibited` / `granted` on that slot; `never` lives on `(redline … ai-training never …)`.
Copying it made Request B return `needs-consent` (R-LIC-AI-OPTIN) after a passport
was issued. Fix: agreed terms stay `opt-in-paid`; stance is stored as `ai_stance`.

## 2026-10-19 — Docker PETTA_HOME

Compose must use `/app/.vendor/PeTTa` (where `setup_petta.py` clones inside
`Dockerfile.api`). An earlier `/opt/petta` path would miss the engine. The web
image proxies `/api/` to the api service so the browser stays same-origin.
