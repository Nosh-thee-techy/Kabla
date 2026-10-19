import { useEffect, useState } from "react";
import { api, type Preset } from "../api";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { t, type Lang } from "../i18n";
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

  return (
    <Room>
      <h1 className="font-display italic text-4xl">{t(lang, "licence")}</h1>
      <p className="mt-2 text-sm opacity-80">Three envelopes for “Asali ya Jioni” (SYNTHETIC).</p>
      {presets.length === 0 && !err && (
        <p className="mt-6 text-sm opacity-60">{t(lang, "sortingEnvelopes")}</p>
      )}
      <ul className="mt-8 grid md:grid-cols-3 gap-4">
        {presets.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => run(p)} className="envelope w-full text-left rounded-sm px-5 pt-12 pb-5">
              <span className="font-mono text-[11px] uppercase tracking-widest">Request {p.id}</span>
              <p className="font-display italic text-2xl mt-1">{p.label}</p>
              <p className="text-sm mt-1 opacity-70">{p.request.party} · {p.request.territory} · {p.request.months} months · {p.request.use}</p>
            </button>
          </li>
        ))}
      </ul>
      {verdict && (
        <article className={`mt-10 rounded-sm border-4 ${tone} p-6 bg-white/70 dark:bg-dusk-2/70`}>
          <p className="font-mono text-[11px] uppercase tracking-widest">{verdict.rule_id}</p>
          <h2 className="font-display italic text-4xl mt-2">{label}</h2>
          <p className="mt-4 text-ink dark:text-lamp">{lang === "sw" ? verdict.headline_sw : verdict.headline_en}</p>
          {verdict.missing.length > 0 && (
            <ul className="mt-4 text-sm">
              {verdict.missing.map((m) => (
                <li key={m.person} className="flex items-center gap-2">
                  <span className="seal seal-amber">{m.share}%</span>
                  {m.name} · {m.right}
                </li>
              ))}
            </ul>
          )}
          {verdict.conditions.map((c) => (
            <p key={c.key} className="mt-2 text-sm">· {lang === "sw" ? c.text_sw : c.text_en}</p>
          ))}
        </article>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      <NextStamp to="/passport">{t(lang, "nextPassport")}</NextStamp>
    </Room>
  );
}
