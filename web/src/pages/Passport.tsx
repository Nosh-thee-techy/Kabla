import { useEffect, useState } from "react";
import { api, type Readiness } from "../api";
import { BadgeShelf } from "../components/BadgeShelf";
import { ChecklistGate } from "../components/ChecklistGate";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { ScoreRing } from "../components/ScoreRing";
import { shortHash } from "../lib/format";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function Passport({ lang }: { lang: Lang }) {
  const { contract, passport: data, setPassport } = useKabla();
  const [ready, setReady] = useState<Readiness | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sell, setSell] = useState(false);
  const [why, setWhy] = useState(false);

  useEffect(() => {
    if (!contract) return;
    api.readiness(contract.id).then(setReady).catch(() => setReady(null));
  }, [contract]);

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
      <div className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "booklet")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "passport")}</h1>
        </div>
        <p className="font-mono text-[11px] opacity-60">Evidence of agreed terms — not a legal instrument · SYNTHETIC</p>
      </div>
      <Clerk lang={lang} page="passport" say={t(lang, data ? "sayPassportIssued" : "sayPassport")} />
      <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-x-8 gap-y-6 items-start">
        <div>
          {ready && <ChecklistGate lang={lang} items={ready.checklist} />}
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sell} onChange={(e) => setSell(e.target.checked)} />
            {t(lang, "sell")}
          </label>
          <button type="button" onClick={go} className="stamp stamp-savanna mt-3">
            {t(lang, "register")} → {t(lang, "issue")}
          </button>
          {err && <p className="text-flag-red text-sm mt-3" role="alert">{err}</p>}
        </div>
        {data && (
          <section className="panel grid md:grid-cols-2 overflow-hidden border-gold/50">
            <article className="p-4 border-b md:border-b-0 md:border-r border-dashed border-gold/30">
              <p className="sticker">{t(lang, "synthetic").split("—")[0]}</p>
              <p className="font-display italic text-2xl mt-4 leading-tight">{title}</p>
              <p className="mt-3 font-mono text-xs break-all">
                {shortHash(hash)}
                <button
                  type="button"
                  className="ml-2 underline"
                  onClick={() => navigator.clipboard.writeText(hash)}
                >
                  {t(lang, "copyHash")}
                </button>
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest opacity-50">Zawadi · consent to register</p>
            </article>
            <article className="p-4 space-y-4">
              <BadgeShelf names={(data.badges || []).map((b) => b.badge.name)} />
              <ScoreRing value={data.score.score} label={t(lang, "health")} />
              <button type="button" className="underline text-xs" onClick={() => setWhy(!why)}>
                {t(lang, "whyScore")}
              </button>
              {why && (
                <ul className="space-y-1">
                  {data.score.reasons.map((r) => (
                    <li key={r.event_id} className="font-mono text-[11px]">
                      {r.event_id}: {r.points > 0 ? "+" : ""}{r.points} — {r.why}
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <p className="label">{t(lang, "next")}</p>
                <ul className="list-disc ml-4 text-sm mt-2 space-y-0.5">
                  {data.score.next_best_steps.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </article>
          </section>
        )}
      </div>
      {data && <NextStamp to="/financier">{t(lang, "nextFinancier")}</NextStamp>}
    </Room>
  );
}
