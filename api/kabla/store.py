"""SQLite store. Single-user demo: JSON blobs in a handful of tables."""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path

from kabla.config import get_settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS contracts (id TEXT PRIMARY KEY, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS redlines (
  artist TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY (artist, kind));
CREATE TABLE IF NOT EXISTS negotiations (id TEXT PRIMARY KEY, contract_id TEXT, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE, artist TEXT, type TEXT, subject TEXT,
  date TEXT, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ledger (seq INTEGER PRIMARY KEY, artist TEXT, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS works (id TEXT PRIMARY KEY, body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS licences (id TEXT PRIMARY KEY, work_id TEXT, body TEXT NOT NULL);
"""


def today() -> str:
    return datetime.now(UTC).date().isoformat()


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def _db_path() -> Path:
    path = get_settings().db_path
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


@contextmanager
def connect():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    try:
        conn.executescript(SCHEMA)
        yield conn
        conn.commit()
    finally:
        conn.close()


def reset() -> None:
    with connect() as c:
        for table in ("contracts", "redlines", "negotiations", "events", "ledger", "works", "licences"):
            c.execute(f"DELETE FROM {table}")
        c.execute("DELETE FROM sqlite_sequence WHERE name='events'")


# ── generic JSON tables ──────────────────────────────────────────────────────
def _put(table: str, key: str, body: dict, **cols) -> None:
    names = ["id", "body", *cols]
    values = [key, json.dumps(body, ensure_ascii=False), *cols.values()]
    with connect() as c:
        c.execute(f"INSERT OR REPLACE INTO {table} ({','.join(names)}) VALUES ({','.join('?' * len(names))})", values)


def _get(table: str, key: str) -> dict | None:
    with connect() as c:
        row = c.execute(f"SELECT body FROM {table} WHERE id=?", (key,)).fetchone()
    return json.loads(row["body"]) if row else None


def put_contract(contract: dict) -> None:
    _put("contracts", contract["id"], contract)


def get_contract(cid: str) -> dict | None:
    return _get("contracts", cid)


def list_contracts() -> list[dict]:
    """Every stored contract. Used by the read-only financier view, not a new dataset."""
    with connect() as c:
        rows = c.execute("SELECT body FROM contracts ORDER BY id").fetchall()
    return [json.loads(r["body"]) for r in rows]


def put_negotiation(session: dict) -> None:
    _put("negotiations", session["id"], session, contract_id=session["contract_id"])


def get_negotiation(sid: str) -> dict | None:
    return _get("negotiations", sid)


def latest_negotiation(contract_id: str) -> dict | None:
    with connect() as c:
        rows = c.execute("SELECT body FROM negotiations WHERE contract_id=? ORDER BY rowid DESC",
                         (contract_id,)).fetchall()
    return json.loads(rows[0]["body"]) if rows else None


def agreed_negotiations() -> list[dict]:
    with connect() as c:
        rows = c.execute("SELECT body FROM negotiations ORDER BY rowid").fetchall()
    return [s for s in (json.loads(r["body"]) for r in rows) if s.get("state") == "agreed"]


def put_work(work: dict) -> None:
    _put("works", work["id"], work)


def get_work(wid: str) -> dict | None:
    return _get("works", wid)


def put_licence(record: dict) -> None:
    _put("licences", record["request_id"], record, work_id=record["work_id"])


def list_licences(work_id: str) -> list[dict]:
    with connect() as c:
        rows = c.execute("SELECT body FROM licences WHERE work_id=? ORDER BY rowid", (work_id,)).fetchall()
    return [json.loads(r["body"]) for r in rows]


# ── red lines ────────────────────────────────────────────────────────────────
def set_redline(artist: str, kind: str, body: dict) -> None:
    with connect() as c:
        c.execute("INSERT OR REPLACE INTO redlines (artist, kind, body) VALUES (?,?,?)",
                  (artist, kind, json.dumps(body, ensure_ascii=False)))


def list_redlines(artist: str) -> list[dict]:
    with connect() as c:
        rows = c.execute("SELECT body FROM redlines WHERE artist=? ORDER BY kind", (artist,)).fetchall()
    return [json.loads(r["body"]) for r in rows]


# ── verified events ──────────────────────────────────────────────────────────
def add_event(artist: str, type_: str, subject: str, detail: dict | None = None) -> dict:
    with connect() as c:
        cur = c.execute("INSERT INTO events (artist, type, subject, date, body) VALUES (?,?,?,?,?)",
                        (artist, type_, subject, today(), "{}"))
        eid = f"e-{cur.lastrowid:04d}"
        event = {"id": eid, "artist": artist, "type": type_, "subject": subject, "date": today(),
                 "verified": True, "detail": detail or {}}
        c.execute("UPDATE events SET id=?, body=? WHERE seq=?", (eid, json.dumps(event, ensure_ascii=False),
                                                                cur.lastrowid))
    return event


def list_events(artist: str) -> list[dict]:
    with connect() as c:
        rows = c.execute("SELECT body FROM events WHERE artist=? ORDER BY seq", (artist,)).fetchall()
    return [json.loads(r["body"]) for r in rows]


def has_event(artist: str, type_: str, subject: str) -> bool:
    with connect() as c:
        row = c.execute("SELECT 1 FROM events WHERE artist=? AND type=? AND subject=?",
                        (artist, type_, subject)).fetchone()
    return row is not None


# ── hash-linked ledger ───────────────────────────────────────────────────────
def ledger_append(artist: str, record: dict) -> None:
    with connect() as c:
        c.execute("INSERT INTO ledger (seq, artist, body) VALUES (?,?,?)",
                  (record["seq"], artist, json.dumps(record, ensure_ascii=False)))


def ledger_all() -> list[dict]:
    with connect() as c:
        rows = c.execute("SELECT body FROM ledger ORDER BY seq").fetchall()
    return [json.loads(r["body"]) for r in rows]
