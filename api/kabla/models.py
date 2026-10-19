"""Pydantic models shared by the routers."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Severity = Literal["red", "amber", "green"]
Lang = Literal["en", "sw"]


class Clause(BaseModel):
    n: int
    type: str
    attrs: list[str | int | float]
    quote: str = ""


class Extraction(BaseModel):
    contract_id: str
    kind: str
    artist: str
    parties: dict[str, str]
    policy: str | None = None
    clauses: list[Clause]
    source: Literal["fixture", "llm"] = "fixture"


class TrailLine(BaseModel):
    """One step of a reasoning trail: which rule fired, on which clauses, from which facts."""
    rule_id: str
    clause_numbers: list[int] = Field(default_factory=list)
    facts: list[str] = Field(default_factory=list)
    text_en: str
    text_sw: str


class Flag(BaseModel):
    clause: int
    rule_id: str
    severity: Severity
    base_severity: Severity
    topic: str
    title_en: str
    title_sw: str
    meaning_en: str
    meaning_sw: str
    cost_en: str
    cost_sw: str
    trail: list[TrailLine]


class ContractCreate(BaseModel):
    sample_id: str | None = None
    text: str | None = None
    artist: str = "zawadi"
    kind: str | None = None
    label: str | None = None


class Contract(BaseModel):
    id: str
    title: str
    text: str
    artist: str
    kind: str | None = None
    label: str | None = None
    synthetic: bool = True


class Analysis(BaseModel):
    contract_id: str
    mode: str
    extraction_source: str
    clauses: list[Clause]
    flags: list[Flag]
    summary: dict[str, int]
    clause_severity: dict[int, Severity]
    trail: list[TrailLine]


class SimulateRequest(BaseModel):
    streams: int = Field(1_000_000, ge=0, le=1_000_000_000)


class Scenario(BaseModel):
    label: str
    royalty_pct: float
    advance: float
    recoup_debt: float
    gross: float
    royalty_earned: float
    artist_keeps: float


class Simulation(BaseModel):
    contract_id: str
    streams: int
    profile: str
    illustrative: bool = True
    as_written: Scenario
    counter: Scenario
    counter_source: Literal["artist-asks", "agreed"]


class LicenceRequest(BaseModel):
    work_id: str = "w-asali"
    use: Literal["ad", "sync-ad", "sync-film", "live", "sample", "ai-training"]
    territory: str
    months: int = Field(ge=1, le=600)
    party: str


class MissingConsent(BaseModel):
    person: str
    name: str
    right: str
    share: float


class Condition(BaseModel):
    key: str
    text_en: str
    text_sw: str
    ref: str | None = None


class LicenceVerdict(BaseModel):
    request_id: str
    verdict: Literal["cleared", "not-cleared", "needs-consent"]
    rule_id: str
    headline_en: str
    headline_sw: str
    missing: list[MissingConsent] = Field(default_factory=list)
    conditions: list[Condition] = Field(default_factory=list)
    trail: list[TrailLine]


class RedlineCreate(BaseModel):
    artist: str
    kind: Literal["ai-training", "term-max-years"]
    value: str | int
    said: str = ""


class Redline(BaseModel):
    artist: str
    kind: str
    value: str | int
    set_on: str
    said: str = ""
    source: str = "kabla"


class Decision(BaseModel):
    topic: str
    decision: Literal["approve", "reject"]


class DecideRequest(BaseModel):
    decisions: list[Decision]


class NegoTopic(BaseModel):
    topic: str
    clause: int
    current: str | int
    ask: str | int
    label_pos: int
    offered: str | int
    kind: Literal["accept", "counter", "reject"]
    policy_line: str
    advice: str
    advice_value: str | int
    status: Literal["open", "agreed", "rejected"]
    is_redline: bool
    severity: str
    rule_id: str


class NegoSession(BaseModel):
    id: str
    contract_id: str
    policy: str
    round: int
    max_rounds: int = 4
    state: Literal["open", "agreed", "standoff", "walk-away"]
    topics: list[NegoTopic]
    ledger: list[dict]
    unresolved: list[str] = Field(default_factory=list)
    lawyer_note: str | None = None


class WorkCreate(BaseModel):
    work_id: str = "w-asali"
    consent_to_register: bool
    consent_to_sell: bool = False


class VerifyRequest(BaseModel):
    certificate: dict | None = None
    ledger: list[dict] | None = None
    work_file_b64: str | None = None


class ChatRequest(BaseModel):
    question: str
    contract_id: str | None = None
    lang: Lang = "en"
