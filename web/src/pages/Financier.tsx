import { useEffect, useState } from "react";
import { api, type FinancierView } from "../api";
import { HowTo } from "../components/HowTo";
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
      <p className="sticker">{t(lang, "backerBanner")}</p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold mt-6">{t(lang, "financier")}</p>
      <h1 className="font-display italic text-4xl mt-2">{t(lang, "financier")}</h1>
      {data && (
        <>
          <p className="mt-3 text-sm opacity-80">{data.work_title} · {data.artist}</p>
          <section className="panel mt-8 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold">
              {t(lang, "owners")}
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {data.owners.map((o) => (
                <li key={`${o.right}-${o.person}`}>
                  {o.name} · {o.right} · {o.share}%
                  {" — "}
                  {o.confirmed ? t(lang, "confirmed") : t(lang, "unconfirmed")}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel mt-4 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold">
              {t(lang, "riskToBacker")}
            </p>
            <ul className="mt-3 space-y-3 text-sm">
              {data.flags.map((f) => (
                <li key={`${f.contract_id}-${f.rule_id}-${f.clause}`}>
                  <span className={`seal ${f.severity === "red" ? "seal-red" : "seal-amber"} mr-2`}>
                    {f.clause}
                  </span>
                  <span className="font-mono text-xs">{f.rule_id}</span>
                  {" — "}
                  {f.risk}
                </li>
              ))}
            </ul>
          </section>
          <section className="panel mt-4 p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold">
              {t(lang, "aiStance")}
            </p>
            <p className="mt-2 text-sm">
              {data.ai_stance.value ?? "—"}
              {data.ai_stance.set_on && ` · ${t(lang, "youSetThis")} ${data.ai_stance.set_on}`}
            </p>
            {data.consent_gaps.length > 0 && (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] mt-4 opacity-60">
                  {t(lang, "consentGaps")}
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {data.consent_gaps.map((g) => (
                    <li key={g.person}>{g.name} ({g.share}%) — {g.why}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <section className="panel mt-4 p-5 flex flex-wrap gap-6 items-center">
            <ScoreRing value={data.score.score} label={t(lang, "health")} />
            <ul className="text-xs font-mono space-y-1">
              {data.score.reasons.map((r) => (
                <li key={r.event_id}>
                  {r.points > 0 ? "+" : ""}{r.points} — {r.why}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      <NextStamp to="/verify">{t(lang, "nextVerify")}</NextStamp>
      <HowTo lang={lang} page="financier" />
    </Room>
  );
}
