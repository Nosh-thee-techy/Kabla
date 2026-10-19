import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Sample } from "../api";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function Desk({ lang }: { lang: Lang }) {
  const { setContract, setAnalysis } = useKabla();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => { api.samples().then((s) => setSamples(s.contracts)).catch((e) => setErr(String(e))); }, []);

  async function run(body: { sample_id?: string; text?: string }) {
    setBusy(true); setErr(null);
    try {
      const c = await api.createContract(body);
      const a = await api.analyze(c.id);
      setContract(c); setAnalysis(a);
      nav("/map");
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-5xl md:text-6xl">Kabla</h1>
      <p className="mt-3 text-xl text-ink/80 dark:text-paper/80">{t(lang, "tagline")}</p>
      <h2 className="mt-12 font-display text-2xl">{t(lang, "pick")}</h2>
      <ul className="mt-6 grid md:grid-cols-3 gap-4">
        {samples.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => run({ sample_id: s.id })} disabled={busy}
              className="h-full w-full text-left rounded-2xl border border-ink/10 bg-white/70 dark:bg-white/5 p-5 hover:border-savanna">
              <p className="text-xs uppercase tracking-widest text-terracotta">{s.id}</p>
              <h3 className="font-display text-xl mt-1">{s.label}</h3>
              <p className="mt-2 text-sm text-ink/70">{s.blurb}</p>
              <p className="mt-3 text-xs">{s.kind} · SYNTHETIC</p>
            </button>
          </li>
        ))}
      </ul>
      <h2 className="mt-12 font-display text-2xl">{t(lang, "paste")}</h2>
      <textarea className="mt-3 w-full min-h-40 rounded-xl border border-ink/15 bg-white/80 p-3" value={text}
        onChange={(e) => setText(e.target.value)} aria-label={t(lang, "paste")} />
      <button type="button" disabled={busy || !text.trim()} onClick={() => run({ text })}
        className="mt-3 bg-savanna text-paper px-5 py-2 rounded-lg disabled:opacity-50">
        {busy ? t(lang, "analysing") : t(lang, "analyse")}
      </button>
      {err && <p className="mt-3 text-flag-red" role="alert">{err}</p>}
    </main>
  );
}
