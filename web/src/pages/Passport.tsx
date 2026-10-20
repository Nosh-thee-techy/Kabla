import { useState } from "react";
import { BadgeShelf } from "../components/BadgeShelf";
import { HowTo } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { ScoreRing } from "../components/ScoreRing";
import { shortHash } from "../lib/format";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";
import { api } from "../api";

export function Passport({ lang }: { lang: Lang }) {
  const { passport: data, setPassport } = useKabla();
  const [err, setErr] = useState<string | null>(null);
  const [sell, setSell] = useState(false);
  const [why, setWhy] = useState(false);

  async function go() {
    setErr(null);
    try {
      await api.registerWork(sell);
      setPassport(await api.issuePassport("zawadi"));
    } catch (e) { setErr(String(e)); }
  }

  const cert = data?.certificate || data?.certificates?.[0];
  const hash = cert && typeof cert === "object" && "work" in cert
    ? String((cert.work as { sha256?: string }).sha256 || "") : "";
  const title = cert && typeof cert === "object" && "work" in cert
    ? String((cert.work as { title?: string }).title || "Asali ya Jioni") : "Asali ya Jioni";

  return (
    <Room>
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{t(lang, "booklet")}</p>
      <h1 className="font-display italic text-4xl mt-2">{t(lang, "passport")}</h1>
      <p className="mt-2 text-sm opacity-80">Evidence of agreed terms — not a legal instrument. SYNTHETIC.</p>
      <label className="mt-6 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sell} onChange={(e) => setSell(e.target.checked)} />
        {t(lang, "sell")}
      </label>
      <button type="button" onClick={go} className="stamp stamp-savanna mt-4">
        {t(lang, "register")} → {t(lang, "issue")}
      </button>
      {data && (
        <section className="panel mt-10 grid md:grid-cols-2 overflow-hidden border-gold/50">
          <article className="p-6 border-b md:border-b-0 md:border-r border-dashed border-gold/30">
            <p className="sticker">{t(lang, "synthetic").split("—")[0]}</p>
            <p className="font-display italic text-3xl mt-6">{title}</p>
            <p className="mt-4 font-mono text-sm break-all">
              {shortHash(hash)}
              <button
                type="button"
                className="ml-2 underline text-xs"
                onClick={() => navigator.clipboard.writeText(hash)}
              >
                {t(lang, "copyHash")}
              </button>
            </p>
            <p className="mt-6 text-xs uppercase tracking-widest opacity-50">Zawadi · consent to register</p>
          </article>
          <article className="p-6 space-y-6">
            <BadgeShelf names={(data.badges || []).map((b) => b.badge.name)} />
            <ScoreRing value={data.score.score} label={t(lang, "health")} />
            <button type="button" className="underline text-sm" onClick={() => setWhy(!why)}>
              {t(lang, "whyScore")}
            </button>
            {why && (
              <ul className="text-sm space-y-1">
                {data.score.reasons.map((r) => (
                  <li key={r.event_id} className="font-mono text-xs">
                    {r.event_id}: {r.points > 0 ? "+" : ""}{r.points} — {r.why}
                  </li>
                ))}
              </ul>
            )}
            <div>
              <h2 className="font-display text-xl">{t(lang, "next")}</h2>
              <ul className="list-disc ml-5 text-sm mt-2">
                {data.score.next_best_steps.map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </article>
        </section>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      {data && <NextStamp to="/verify">{t(lang, "nextVerify")}</NextStamp>}
      <HowTo lang={lang} page="passport" />
    </Room>
  );
}
