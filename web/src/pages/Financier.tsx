import { useEffect, useState } from "react";
import { api, type FinancierView } from "../api";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { ScoreRing } from "../components/ScoreRing";
import { t, type Lang } from "../i18n";

/** Why this page exists: a backer sees the same owners, flags and score — rearranged, not rescored. */
export function Financier({ lang }: { lang: Lang }) {
  const [data, setData] = useState<FinancierView | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.financier("zawadi").then(setData).catch((e) => setErr(String(e)));
  }, []);

  return (
    <Room>
      <div className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "financier")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">
            {data ? data.work_title : t(lang, "financier")}
          </h1>
          {data && <p className="font-mono text-[11px] mt-1.5 opacity-60">{data.artist}</p>}
        </div>
        <p className="guide-card max-w-xs font-mono text-[10px] uppercase tracking-wider leading-relaxed">{t(lang, "backerBanner")}</p>
      </div>
      <Clerk lang={lang} page="financier" cue="financier" say={t(lang, "sayFinancier")} cta={{ label: t(lang, "ctaCustoms"), to: "/verify" }} />
      {data && (
        <div className="mt-5 grid lg:grid-cols-2 gap-x-8 gap-y-6 items-start">
          {/* Left column: who owns it and where the money could leak. */}
          <section>
            <p className="label">{t(lang, "owners")}</p>
            <dl className="ledger mt-2">
              {data.owners.map((o) => (
                <div key={`${o.right}-${o.person}`}>
                  <dt>{o.name} · {o.right}</dt>
                  <dd>
                    {o.share}%{" "}
                    <span className={`seal ${o.confirmed ? "seal-green" : "seal-amber"} !w-5 !h-5 !text-[10px] ml-1 align-middle`} title={o.confirmed ? t(lang, "confirmed") : t(lang, "unconfirmed")}>
                      {o.confirmed ? "✓" : "!"}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="label mt-6">{t(lang, "riskToBacker")}</p>
            <ul className="mt-2 space-y-2 text-sm">
              {data.flags.map((f) => (
                <li key={`${f.contract_id}-${f.rule_id}-${f.clause}`} className="flex gap-2 items-baseline">
                  <span className={`seal ${f.severity === "red" ? "seal-red" : "seal-amber"} !w-6 !h-6 !text-[10px] shrink-0`}>
                    {f.clause}
                  </span>
                  <span><span className="font-mono text-[11px] opacity-70">{f.rule_id}</span> — {f.risk}</span>
                </li>
              ))}
            </ul>
          </section>
          {/* Right column: stance, gaps, score. */}
          <section>
            <p className="label">{t(lang, "aiStance")}</p>
            <p className="mt-2 text-sm">
              {data.ai_stance.value ?? "—"}
              {data.ai_stance.set_on && <span className="opacity-60"> · {t(lang, "youSetThis")} {data.ai_stance.set_on}</span>}
            </p>
            {data.consent_gaps.length > 0 && (
              <>
                <p className="label mt-6">{t(lang, "consentGaps")}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {data.consent_gaps.map((g) => (
                    <li key={g.person}>{g.name} ({g.share}%) — {g.why}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="label mt-6">{t(lang, "health")}</p>
            <div className="mt-3 flex flex-wrap gap-5 items-center">
              <ScoreRing value={data.score.score} label={t(lang, "health")} />
              <ul className="text-[11px] font-mono space-y-0.5">
                {data.score.reasons.map((r) => (
                  <li key={r.event_id}>
                    {r.points > 0 ? "+" : ""}{r.points} — {r.why}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      )}
      {err && <p className="text-flag-red text-sm mt-4" role="alert">{err}</p>}
      <NextStamp to="/verify">{t(lang, "nextVerify")}</NextStamp>
    </Room>
  );
}
