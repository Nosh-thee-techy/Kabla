"""Bridge to the MeTTa engine on PeTTa.

Boring on purpose: for one request we write the facts to a temporary
facts.metta, write the queries to query.metta, run

    swipl -q -s PeTTa/src/main.pl -- engine/main.metta [extra .metta] facts.metta query.metta --silent

and parse every printed line that starts with "(result ". PeTTa loads the files
in order into one &self, so the rules see the facts. Nothing here decides
anything: it only moves facts in and results out.
"""
from __future__ import annotations

import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from kabla.config import get_settings

_SYMBOL_RE = re.compile(r"^[A-Za-z][A-Za-z0-9_\-.§]*$|^\d{4}-\d{2}-\d{2}$")


class EngineError(RuntimeError):
    pass


@dataclass(frozen=True)
class Sym:
    """A MeTTa symbol (as opposed to a string literal)."""
    name: str

    def __post_init__(self) -> None:
        if not _SYMBOL_RE.match(self.name):
            raise ValueError(f"not a safe MeTTa symbol: {self.name!r}")

    def __str__(self) -> str:
        return self.name


def sym_or_str(value: str) -> Sym | str:
    """Symbol if it is a safe identifier (e.g. extracted clause attributes), otherwise a string."""
    return Sym(value) if _SYMBOL_RE.match(value) else value


def to_metta(value) -> str:
    if isinstance(value, Sym):
        return value.name
    if isinstance(value, bool):
        return "True" if value else "False"
    if isinstance(value, int | float):
        return repr(value)
    if isinstance(value, str):
        cleaned = value.replace("\\", "\\\\").replace('"', '\\"').replace("\r", " ").replace("\n", " ")
        return f'"{cleaned}"'
    if isinstance(value, list | tuple):
        return "(" + " ".join(to_metta(v) for v in value) + ")"
    raise TypeError(f"cannot express {type(value).__name__} in MeTTa")


def fact(*parts) -> str:
    return to_metta(list(parts))


# ── output parsing ───────────────────────────────────────────────────────────
_TOKEN_RE = re.compile(r'\s*(?:(\()|(\))|"((?:[^"\\]|\\.)*)"|([^\s()"]+))')


def parse_sexpr(text: str):
    """Parse one s-expression. Lists -> Python lists, numbers -> int/float,
    true/false -> bool, strings -> str, symbols -> Sym-free plain str."""
    pos = 0
    stack: list[list] = [[]]
    while pos < len(text):
        m = _TOKEN_RE.match(text, pos)
        if not m or m.end() == pos:
            if text[pos:].strip() == "":
                break
            raise EngineError(f"cannot parse engine output near: {text[pos:pos + 40]!r}")
        pos = m.end()
        lpar, rpar, string, atom = m.groups()
        if lpar:
            stack.append([])
        elif rpar:
            done = stack.pop()
            stack[-1].append(done)
        elif string is not None:
            stack[-1].append(_unescape(string))
        elif atom is not None:
            stack[-1].append(_atom(atom))
    if len(stack) != 1 or len(stack[0]) != 1:
        raise EngineError(f"unbalanced engine output: {text[:80]!r}")
    return stack[0][0]


_ESCAPES = {"n": "\n", "t": "\t", '"': '"', "\\": "\\"}


def _unescape(s: str) -> str:
    return re.sub(r"\\(.)", lambda m: _ESCAPES.get(m.group(1), m.group(1)), s)


def _atom(tok: str):
    if tok == "true":
        return True
    if tok == "false":
        return False
    try:
        return int(tok)
    except ValueError:
        pass
    try:
        return float(tok)
    except ValueError:
        return tok


@dataclass
class EngineRun:
    results: dict[str, list[list]]
    facts_text: str
    query_text: str

    def one(self, tag: str):
        """First (usually only) value list for a tag; [] if the tag never printed."""
        rows = self.results.get(tag, [])
        return rows[0] if rows else []

    def first_value(self, tag: str, default=None):
        row = self.one(tag)
        return row[0] if row else default


def run_engine(facts: list[str], queries: list[str], extra_files: list[Path] | None = None,
               timeout: int = 90) -> EngineRun:
    s = get_settings()
    main_pl = s.petta_home / "src" / "main.pl"
    if not main_pl.exists():
        raise EngineError(f"PeTTa not found at {s.petta_home}. Run `python scripts/tasks.py setup`.")
    facts_text = "; SYNTHETIC request facts written by metta_bridge\n" + "\n".join(facts) + "\n"
    query_text = "\n".join(queries) + "\n"
    with tempfile.TemporaryDirectory(prefix="kabla-") as tmp:
        facts_file = Path(tmp) / "facts.metta"
        query_file = Path(tmp) / "query.metta"
        facts_file.write_text(facts_text, encoding="utf-8")
        query_file.write_text(query_text, encoding="utf-8")
        files = [s.engine_dir / "main.metta", *(extra_files or []), facts_file, query_file]
        cmd = [s.swipl, "--stack_limit=2g", "-q", "-s", str(main_pl), "--", *map(str, files), "--silent"]
        try:
            proc = subprocess.run(cmd, capture_output=True, timeout=timeout)
        except FileNotFoundError as exc:
            raise EngineError(f"swipl not found ({s.swipl}); install SWI-Prolog or set SWIPL") from exc
        except subprocess.TimeoutExpired as exc:
            raise EngineError("engine timed out") from exc
    stdout = _decode(proc.stdout)
    stderr = _decode(proc.stderr)
    if proc.returncode != 0:
        raise EngineError(f"PeTTa exited {proc.returncode}: {stderr.strip()[-1500:]}")
    results: dict[str, list[list]] = {}
    for line in stdout.splitlines():
        if line.startswith("(result "):
            parsed = parse_sexpr(line)
            results.setdefault(str(parsed[1]), []).append(parsed[2:])
    return EngineRun(results=results, facts_text=facts_text, query_text=query_text)


def _decode(raw: bytes | None) -> str:
    """SWI-Prolog on Windows may print Latin-1 for characters such as §. """
    if not raw:
        return ""
    for enc in ("utf-8", "cp1252", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def query(tag: str, expr: str) -> str:
    """Build one query line: !(result <tag> <expr>)."""
    if not _SYMBOL_RE.match(tag):
        raise ValueError(tag)
    return f"!(result {tag} {expr})"
