import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Readiness, type ScoreSlice } from "../api";
import { ChecklistGate } from "../components/ChecklistGate";
import { EmptyGate } from "../components/EmptyGate";
import { Clerk } from "../components/HowTo";
import { Room } from "../components/Room";
import { afterName, SignHeadline, TrailChart, type Pick, type TrailPoint } from "../components/SignReadiness";
import { t, tf, tOpt, type Lang } from "../i18n";
import { plainFlagTitle } from "../plain";
import { useKabla } from "../state";
import "../signcheck.css";

type Reason = ScoreSlice["reasons"][number];
type Group = { type: string; items: Reason[]; points: number };

/** Same shape and key that the Theater writes: kabla:trail:<contractId>. This page only reads it. */
function loadTrail(contractId: string): TrailPoint[] {
  try {
    const raw = sessionStorage.getItem(`kabla:trail:${contractId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as { points?: TrailPoint[] };
      if (Array.isArray(parsed.points)) return parsed.points;
    }
  } catch { /* ignore */ }
  return [];
}

/** Same kind of reason, one card: "3 red warnings, -15 in all" reads better than three equal lines. */
function group(reasons: Reason[]): Group[] {
  const out: Group[] = [];
  for (const r of reasons) {
    const g = out.find((x) => x.type === r.type);
    if (g) { g.items.push(r); g.points += r.points; }
    else out.push({ type: r.type, items: [r], points: r.points });
  }
  return out;
}

export function SignCheck({ lang }: { lang: Lang }) {
  const { contract, nego } = useKabla();
  const [ready, setReady] = useState<Readiness | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pick, setPick] = useState<Pick>("after");
  const [trail, setTrail] = useState<TrailPoint[]>(() => (contract ? loadTrail(contract.id) : []));

  useEffect(() => {
    if (!contract) return;
    let live = true;
    setTrail(loadTrail(contract.id));
    api.readiness(contract.id)
      .then((r) => { if (live) { setReady(r); setErr(null); setTrail(loadTrail(contract.id)); } })
      .catch((e) => { if (live) setErr(String(e)); });
    return () => { live = false; };
  }, [contract, nego]);

  if (!contract) return <EmptyGate lang={lang} title={t(lang, "signCheck")} />;

  const slice = ready ? (pick === "after" ? ready.after : ready.as_written) : null;
  const groups = slice ? group(slice.reasons) : [];
  const costs = groups.filter((g) => g.points < 0);
  const goods = groups.filter((g) => g.points > 0);
  const goodCount = goods.reduce((n, g) => n + g.items.length, 0);
  const flagFor = (ruleId: string) => ready?.fairness.flags.find((f) => f.rule_id === ruleId);
  const pickName = ready ? (pick === "after" ? afterName(lang, ready) : t(lang, "asWritten")) : "";

  return (
    <Room>
      <div className="ck-room w-full">
        <header className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "groupDuring")}</p>
            <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "signCheck")}</h1>
          </div>
          <Link to="/theater" className="text-xs underline opacity-70 hover:opacity-100">← {t(lang, "ckBackTheater")}</Link>
        </header>

        <Clerk
          lang={lang}
          page="check"
          cue="check"
          say={t(lang, "sayCheck")}
          cta={{ label: t(lang, "ctaGotIt") }}
        />

        {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
        {!ready && !err && <p className="mt-6 text-sm opacity-60">…</p>}

        {ready && slice && (
          <>
            {/* 1. Headline */}
            <SignHeadline lang={lang} data={ready} pick={pick} onPick={setPick} />
            <p className="ck-hint">{tf(lang, "ckShowing", { name: pickName })}</p>

            {/* 2. What is holding it back: only items that cost points */}
            <section className="ck-section" aria-labelledby="ck-hold">
              <h2 id="ck-hold" className="label">{t(lang, "ckHolding")}</h2>
              {costs.length === 0 ? (
                <p className="ck-none">{t(lang, "ckHoldingNone")}</p>
              ) : (
                <ul className="ck-cards">
                  {costs.map((g) => {
                    const each = g.items[0].points;
                    return (
                      <li key={g.type} className="ck-card">
                        <div className="ck-card-top">
                          <div>
                            <h3 className="ck-card-title">{tOpt(lang, `rt.${g.type}`) ?? g.items[0].why}</h3>
                            {g.items.length > 1 && (
                              <p className="ck-card-sub">{tf(lang, "ckTimes", { count: g.items.length, each })}</p>
                            )}
                          </div>
                          <p className="ck-card-pts" aria-label={tf(lang, "ckLost", { n: g.points })}>{g.points}</p>
                        </div>
                        {g.type === "unresolved-red-signed" && (
                          <ul className="ck-clauses">
                            {g.items.map((r) => {
                              const f = flagFor(r.subject);
                              return f ? (
                                <li key={r.event_id}>
                                  <span>{tf(lang, "ckClause", { n: f.clause })}</span>
                                  {plainFlagTitle(lang, f.rule_id, lang === "sw" ? f.title_sw : f.title_en)}
                                </li>
                              ) : null;
                            })}
                          </ul>
                        )}
                        {tOpt(lang, `rf.${g.type}`) && (
                          <p className="ck-fix"><span>{t(lang, "ckFix")}</span>{tOpt(lang, `rf.${g.type}`)}</p>
                        )}
                        <Details lang={lang} items={g.items} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* 3. Already in good shape: collapsed by default */}
            {goods.length > 0 && (
              <section className="ck-section" aria-labelledby="ck-good">
                <h2 id="ck-good" className="label">{t(lang, "ckGood")}</h2>
                <details className="ck-good">
                  <summary>{tf(lang, "ckGoodCount", { n: goodCount })}</summary>
                  <ul className="ck-good-list">
                    {goods.map((g) => (
                      <li key={g.type}>
                        <b>+{g.points}</b>
                        <span>
                          {tOpt(lang, `rg.${g.type}`) ?? g.items[0].why}
                          <Details lang={lang} items={g.items} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              </section>
            )}

            {/* 4. Before you sign */}
            <section className="ck-section" aria-labelledby="ck-check">
              <h2 id="ck-check" className="label">{t(lang, "checklist")}</h2>
              <ChecklistGate lang={lang} items={ready.checklist} bare />
            </section>

            {/* 5. Round by round */}
            <section className="ck-section" aria-labelledby="ck-trail">
              <h2 id="ck-trail" className="label">{t(lang, "readyTrail")}</h2>
              {trail.length > 0 ? (
                <>
                  <TrailChart lang={lang} trail={trail} />
                  {trail.length < 2 && <p className="ck-hint">{t(lang, "ckTrailNone")}</p>}
                </>
              ) : (
                <p className="ck-none">{t(lang, "ckTrailNone")}</p>
              )}
            </section>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/licence" className="stamp stamp-terracotta">{t(lang, "ctaLicence")} →</Link>
              <p className="text-xs opacity-70">{t(lang, "ckSignWarn")}</p>
            </div>
          </>
        )}
      </div>
    </Room>
  );
}

/** The raw rule names live only here, one tap away. */
function Details({ lang, items }: { lang: Lang; items: Reason[] }) {
  return (
    <details className="ck-details">
      <summary>{t(lang, "ckDetails")}</summary>
      <ul>
        {items.map((r) => (
          <li key={r.event_id}>{r.type} · {r.subject} · {r.points > 0 ? "+" : ""}{r.points} · {r.event_id}</li>
        ))}
      </ul>
    </details>
  );
}
