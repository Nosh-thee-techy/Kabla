const BASE = import.meta.env.VITE_API_URL || "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.headers.get("content-type")?.includes("text/markdown")) {
    return (await res.text()) as T;
  }
  return res.json();
}

export const api = {
  health: () => req<{ mode: string; engine: string }>("/health"),
  /** Karani's voice. The API holds the provider key; the browser only receives audio. */
  voiceStatus: () => req<{ enabled: boolean; provider: string | null }>("/voice/status"),
  voice: async (text: string, lang: string): Promise<Blob> => {
    const res = await fetch(`${BASE}/voice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, lang }),
    });
    if (!res.ok) throw new Error(`voice ${res.status}`);
    return res.blob();
  },
  samples: () => req<{ contracts: Sample[]; artists: Artist[]; synthetic: boolean }>("/samples"),
  createContract: (body: { sample_id?: string; text?: string }) => req<Contract>("/contracts", { method: "POST", body: JSON.stringify(body) }),
  analyze: (id: string) => req<Analysis>(`/contracts/${id}/analyze`, { method: "POST" }),
  simulate: (id: string, streams: number) => req<Simulation>(`/contracts/${id}/simulate`, { method: "POST", body: JSON.stringify({ streams }) }),
  negotiateStart: (id: string) => req<Nego>(`/contracts/${id}/negotiate/start`, { method: "POST" }),
  negotiateDecide: (sid: string, decisions: { topic: string; decision: string }[]) =>
    req<Nego>(`/negotiations/${sid}/decide`, { method: "POST", body: JSON.stringify({ decisions }) }),
  licencePresets: () => req<{ presets: Preset[] }>("/licence/presets"),
  licenceCheck: (body: LicenceReq) => req<LicenceVerdict>("/licence/check", { method: "POST", body: JSON.stringify(body) }),
  registerWork: (consent_to_sell = false) =>
    req("/works", { method: "POST", body: JSON.stringify({ work_id: "w-asali", consent_to_register: true, consent_to_sell }) }),
  issuePassport: (artist: string) => req<Passport>(`/passport/${artist}/issue`, { method: "POST" }),
  getPassport: (artist: string) => req<Passport>(`/passport/${artist}`),
  financier: (artist: string) => req<FinancierView>(`/passport/${artist}/financier`),
  verify: (body: object) => req<VerifyResult>("/verify", { method: "POST", body: JSON.stringify(body) }),
  tamperDemo: (certificate: object) => req<VerifyResult>("/verify/tamper-demo", { method: "POST", body: JSON.stringify({ certificate }) }),
  readiness: (id: string) => req<Readiness>(`/contracts/${id}/readiness`),
};

export type Sample = { id: string; title: string; label: string; kind: string; artist: string; blurb: string };
export type Artist = { id: string; name: string; redlines: { kind: string; value: string | number; set_on: string; said: string }[] };
export type Contract = { id: string; title: string; text: string; artist: string; kind: string; label: string };
export type TrailLine = { rule_id: string; clause_numbers: number[]; facts: string[]; text_en: string; text_sw: string };
export type Flag = {
  clause: number; rule_id: string; severity: "red" | "amber"; topic: string;
  title_en: string; title_sw: string; meaning_en: string; meaning_sw: string;
  cost_en: string; cost_sw: string; trail: TrailLine[];
  redline_set_on?: string | null;
};
export type Clause = { n: number; type: string; attrs: (string | number)[]; quote: string };
export type Analysis = {
  contract_id: string; clauses: Clause[]; flags: Flag[]; summary: { red: number; amber: number };
  clause_severity: Record<string, "red" | "amber">; trail: TrailLine[]; extraction_source: string;
};
export type Simulation = {
  illustrative: boolean; streams: number; profile: string;
  as_written: { artist_keeps: number; royalty_earned: number; recoup_debt: number; advance: number; gross: number };
  counter: { artist_keeps: number; royalty_earned: number; recoup_debt: number; advance: number; gross: number };
};
export type NegoTopic = {
  topic: string; clause: number; current: string | number; ask: string | number; offered: string | number;
  kind: "accept" | "counter" | "reject"; policy_line: string; advice: string; status: string;
  is_redline: boolean; severity: string;
};
export type Nego = { id: string; contract_id: string; round: number; max_rounds: number; state: string; topics: NegoTopic[]; ledger: Record<string, unknown>[]; unresolved: string[]; lawyer_note?: string };
export type Preset = { id: string; label: string; request: LicenceReq };
export type LicenceReq = { work_id: string; use: string; territory: string; months: number; party: string };
export type LicenceVerdict = {
  verdict: "cleared" | "not-cleared" | "needs-consent"; rule_id: string;
  headline_en: string; headline_sw: string;
  missing: { person: string; name: string; right: string; share: number }[];
  conditions: { key: string; text_en: string; text_sw: string }[];
  trail: TrailLine[];
};
export type Passport = {
  certificate?: Record<string, unknown>; certificates?: Record<string, unknown>[];
  badges: { badge: { name: string }; evidence: { id: string }[] }[];
  score: { score: number; label: string; reasons: { event_id: string; points: number; why: string }[]; next_best_steps: string[] };
  ledger?: object[];
};
export type VerifyResult = { intact: boolean; reason: string; broken_seq?: number; mutated?: object };
export type ScoreSlice = {
  score: number; label: string; hypothetical?: boolean;
  reasons: { event_id: string; points: number; type: string; subject: string; why: string; already_true?: boolean }[];
  next_best_steps: string[];
};
export type ChecklistItem = {
  key: string; ok: boolean; label_en: string; label_sw: string; warning_en: string; warning_sw: string;
};
export type FinancierView = {
  artist: string; work_id: string; work_title: string; banner: string; label: string;
  owners: { right: string; person: string; name: string; share: number; confirmed: boolean }[];
  flags: { contract_id: string; rule_id: string; severity: string; clause: number; topic: string;
    title_en: string; title_sw: string; risk: string; redline_set_on?: string | null }[];
  ai_stance: { kind: string; value: string | null; set_on: string | null; said: string | null };
  consent_gaps: { person: string; name: string; right: string; share: number; why: string }[];
  score: { score: number; label: string; reasons: { event_id: string; points: number; why: string }[] };
};
export type Readiness = {
  contract_id: string; artist: string; label: string;
  as_written: ScoreSlice; after: ScoreSlice;
  fairness: {
    red: number; amber: number; fair_topics: string[]; line: string;
    flags: { rule_id: string; severity: string; topic: string; clause: number; title_en: string; title_sw: string }[];
  };
  checklist: ChecklistItem[];
  remaining_reds: string[];
  projected: boolean;
  after_kind?: "best_case" | "after";
};
