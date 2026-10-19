import { useState } from "react";
import { api, type Passport as P } from "../api";
import { BadgeShelf } from "../components/BadgeShelf";
import { ScoreRing } from "../components/ScoreRing";
import { shortHash } from "../lib/format";
import { t, type Lang } from "../i18n";

export function Passport({ lang }: { lang: Lang }) {
  const [data, setData] = useState<P | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sell, setSell] = useState(false);
  const [why, setWhy] = useState(false);

  async function go() {
    setErr(null);
    try {
      await api.registerWork(sell);
      setData(await api.issuePassport("zawadi"));
    } catch (e) { setErr(String(e)); }
  }

  const cert = data?.certificate || data?.certificates?.[0];
  const hash = cert && typeof cert === "object" && "work" in cert
    ? String((cert.work as { sha256?: string }).sha256 || "") : "";

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-display text-4xl">{t(lang, "passport")}</h1>
      <p className="mt-2 text-sm">Evidence of agreed terms — not a legal instrument. SYNTHETIC.</p>
      <label className="mt-6 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sell} onChange={(e) => setSell(e.target.checked)} />
        {t(lang, "sell")}
      </label>
      <button type="button" onClick={go} className="mt-4 bg-savanna text-paper px-4 py-2 rounded-lg">
        {t(lang, "register")} → {t(lang, "issue")}
      </button>
      {data && (
        <section className="mt-8 space-y-8">
          <article className="rounded-2xl border border-ink/10 p-5 bg-white/70 dark:bg-white/5">
            <p className="text-xs uppercase tracking-widest">Certificate</p>
            <p className="font-mono mt-2">{shortHash(hash)}
              <button type="button" className="ml-2 underline text-sm" onClick={() => navigator.clipboard.writeText(hash)}>Copy</button>
            </p>
          </article>
          <BadgeShelf names={(data.badges || []).map((b) => b.badge.name)} />
          <ScoreRing value={data.score.score} label={t(lang, "health")} />
          <button type="button" className="underline text-sm" onClick={() => setWhy(!why)}>{t(lang, "whyScore")}</button>
          {why && (
            <ul className="text-sm space-y-1">
              {data.score.reasons.map((r) => (
                <li key={r.event_id}>{r.event_id}: {r.points > 0 ? "+" : ""}{r.points} — {r.why}</li>
              ))}
            </ul>
          )}
          <div>
            <h2 className="font-display text-xl">{t(lang, "next")}</h2>
            <ul className="list-disc ml-5 text-sm">{data.score.next_best_steps.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>
        </section>
      )}
      {err && <p className="text-flag-red mt-4">{err}</p>}
    </main>
  );
}
