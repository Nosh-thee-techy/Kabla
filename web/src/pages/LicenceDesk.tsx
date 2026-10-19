import { useEffect, useState } from "react";
import { api, type LicenceVerdict, type Preset } from "../api";
import { t, type Lang } from "../i18n";

export function LicenceDesk({ lang }: { lang: Lang }) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [verdict, setVerdict] = useState<LicenceVerdict | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api.licencePresets().then((p) => setPresets(p.presets)).catch((e) => setErr(String(e))); }, []);

  async function run(p: Preset) {
    setErr(null);
    try { setVerdict(await api.licenceCheck(p.request)); }
    catch (e) { setErr(String(e)); }
  }

  const tone = verdict?.verdict === "cleared" ? "border-savanna" : verdict?.verdict === "not-cleared" ? "border-flag-red" : "border-flag-amber";
  const label = verdict ? t(lang, verdict.verdict === "cleared" ? "cleared" : verdict.verdict === "not-cleared" ? "notCleared" : "needsConsent") : "";

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-display text-4xl">{t(lang, "licence")}</h1>
      <p className="mt-2 text-sm">Three preset requests for “Asali ya Jioni” (SYNTHETIC).</p>
      <ul className="mt-6 space-y-3">
        {presets.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => run(p)} className="w-full text-left rounded-xl border border-ink/10 p-4 hover:border-savanna">
              <span className="text-xs uppercase tracking-widest">Request {p.id}</span>
              <p className="font-display text-xl">{p.label}</p>
              <p className="text-sm">{p.request.party} · {p.request.territory} · {p.request.months} months · {p.request.use}</p>
            </button>
          </li>
        ))}
      </ul>
      {verdict && (
        <article className={`mt-8 rounded-xl border-4 ${tone} p-5`}>
          <p className="text-xs uppercase">{verdict.rule_id}</p>
          <h2 className="font-display text-2xl mt-1">{label}</h2>
          <p className="mt-3">{lang === "sw" ? verdict.headline_sw : verdict.headline_en}</p>
          {verdict.missing.length > 0 && (
            <ul className="mt-3 text-sm">
              {verdict.missing.map((m) => <li key={m.person}>{m.name}, {m.share}% {m.right}</li>)}
            </ul>
          )}
          {verdict.conditions.map((c) => (
            <p key={c.key} className="mt-2 text-sm">· {lang === "sw" ? c.text_sw : c.text_en}</p>
          ))}
        </article>
      )}
      {err && <p className="text-flag-red mt-4">{err}</p>}
    </main>
  );
}
