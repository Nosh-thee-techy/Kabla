import { useEffect, useState } from "react";
import { api, type Preset } from "../api";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { t, tf, type Lang } from "../i18n";
import { placeName, plainCondition, plainLicenceHeadline, rightName, useName } from "../plain";
import { useKabla } from "../state";

export function LicenceDesk({ lang }: { lang: Lang }) {
  const { licence: verdict, setLicence } = useKabla();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api.licencePresets().then((p) => setPresets(p.presets)).catch((e) => setErr(String(e))); }, []);

  async function run(p: Preset) {
    setErr(null);
    try { setLicence(await api.licenceCheck(p.request)); }
    catch (e) { setErr(String(e)); }
  }

  const tone = verdict?.verdict === "cleared"
    ? "border-savanna text-savanna"
    : verdict?.verdict === "not-cleared"
      ? "border-flag-red text-flag-red"
      : "border-flag-amber text-flag-amber";
  const label = verdict
    ? t(lang, verdict.verdict === "cleared" ? "cleared" : verdict.verdict === "not-cleared" ? "notCleared" : "needsConsent")
    : "";
  const meaning = verdict
    ? t(lang, verdict.verdict === "cleared" ? "verdictCleared" : verdict.verdict === "not-cleared" ? "verdictNot" : "verdictNeeds")
    : "";
  const original = verdict ? (lang === "sw" ? verdict.headline_sw : verdict.headline_en) : "";
  const headline = verdict ? plainLicenceHeadline(lang, verdict) ?? original : "";

  return (
    <Room>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-3 border-b hair">
        <h1 className="font-display italic text-3xl md:text-4xl leading-none">{t(lang, "licence")}</h1>
        <p className="font-mono text-[11px] opacity-60">{t(lang, "licHeadNote")}</p>
      </div>
      <Clerk
        lang={lang}
        page="licence"
        cue={verdict ? "licence:verdict" : "licence"}
        say={verdict ? tf(lang, "sayLicenceVerdict", { rule: verdict.rule_id }) : t(lang, "sayLicence")}
        cta={
          verdict
            ? { label: t(lang, "ctaSealPassport"), to: "/financier" }
            : presets[0]
              ? { label: t(lang, "ctaEnvelopeA"), onClick: () => void run(presets[0]) }
              : { label: t(lang, "ctaGotIt") }
        }
      />
      {presets.length === 0 && !err && (
        <p className="mt-5 text-sm opacity-60">{t(lang, "sortingEnvelopes")}</p>
      )}
      <ul className="mt-6 grid md:grid-cols-3 gap-4">
        {presets.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => run(p)} className="envelope w-full text-left rounded-sm px-4 pt-10 pb-4">
              <span className="font-mono text-[10px] uppercase tracking-widest">{tf(lang, "licRequest", { id: p.id })}</span>
              <p className="font-display italic text-xl mt-0.5 leading-tight">{p.label}</p>
              <p className="text-xs mt-1.5 opacity-80 leading-snug">
                {tf(lang, "licAsk", {
                  party: p.request.party,
                  use: useName(lang, p.request.use),
                  where: placeName(lang, p.request.territory),
                  months: p.request.months,
                })}
              </p>
            </button>
          </li>
        ))}
      </ul>
      {verdict && (
        <article className={`panel mt-6 border-l-4 ${tone} p-5 max-w-3xl`}>
          <h2 className="font-display italic text-3xl md:text-4xl leading-none">{label}</h2>
          <p className="mt-3 text-sm font-semibold text-ink dark:text-lamp">{meaning}</p>
          <p className="mt-2 text-sm text-ink dark:text-lamp">{headline}</p>
          {verdict.missing.length > 0 && (
            <>
              <p className="label mt-4">{t(lang, "licMissing")}</p>
              <ul className="mt-2 text-sm">
                {verdict.missing.map((m) => (
                  <li key={m.person} className="flex items-center gap-2">
                    <span className="seal seal-amber">{m.share}%</span>
                    {m.name} · {rightName(lang, m.right)}
                  </li>
                ))}
              </ul>
            </>
          )}
          {verdict.conditions.length > 0 && (
            <>
              <p className="label mt-4">{t(lang, "licConditions")}</p>
              {verdict.conditions.map((c) => (
                <p key={c.key} className="mt-1.5 text-sm text-ink dark:text-lamp opacity-90">
                  · {plainCondition(lang, c.key, lang === "sw" ? c.text_sw : c.text_en)}
                </p>
              ))}
            </>
          )}
          <details className="mt-5 text-xs text-ink dark:text-lamp">
            <summary className="cursor-pointer underline opacity-80">{t(lang, "detailsFold")}</summary>
            <p className="mt-3 font-mono text-[11px] opacity-70">{verdict.rule_id}</p>
            <p className="mt-1 opacity-80">{original}</p>
            {verdict.conditions.map((c) => (
              <p key={c.key} className="mt-1 opacity-70">· {lang === "sw" ? c.text_sw : c.text_en}</p>
            ))}
          </details>
        </article>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      <NextStamp to="/financier">{t(lang, "nextFinancier")}</NextStamp>
    </Room>
  );
}
