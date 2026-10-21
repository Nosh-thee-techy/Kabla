import { useState } from "react";
import { Link } from "react-router-dom";
import { BadgeShelf } from "../components/BadgeShelf";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { ScoreRing } from "../components/ScoreRing";
import { shortHash } from "../lib/format";
import { t, type Lang } from "../i18n";
import { useArtist, useKabla } from "../state";

/** Page 2 of the passport job: holding what was issued. Fixed order, top to bottom:
 *  the passport card (label, title, hash, stamps), the score, why that number, next best steps, what to do next.
 *  The register form lives on /passport; nothing here calls the API (the passport is already in state). */
export function PassportIssued({ lang }: { lang: Lang }) {
  const { passport: data } = useKabla();
  const artist = useArtist();
  const [why, setWhy] = useState(false);
  const [copied, setCopied] = useState(false);

  const header = (
    <div className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "booklet")}</p>
        <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "passportTitle")}</h1>
      </div>
      <p className="font-mono text-[11px] opacity-60">{t(lang, "passportEvidenceLine")}</p>
    </div>
  );

  if (!data) {
    return (
      <Room>
        {header}
        <section className="panel border-gold/50 mt-8 max-w-xl mx-auto w-full p-6 md:p-8 text-center">
          <p className="seal seal-gold mx-auto" aria-hidden="true">K</p>
          <h2 className="font-display italic text-2xl mt-4">{t(lang, "passportNoneTitle")}</h2>
          <p className="mt-3 text-sm opacity-80">{t(lang, "passportNoneBody")}</p>
          <Link to="/passport" className="stamp stamp-savanna mt-6">{t(lang, "passportNoneCta")} →</Link>
        </section>
      </Room>
    );
  }

  const cert = data.certificate || data.certificates?.[0];
  const work = cert && typeof cert === "object" && "work" in cert
    ? (cert.work as { sha256?: string; title?: string }) : undefined;
  const hash = String(work?.sha256 || "");
  const title = String(work?.title || "Asali ya Jioni");
  const who = artist.charAt(0).toUpperCase() + artist.slice(1);

  async function copy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked: nothing to do */ }
  }

  return (
    <Room>
      {header}
      <Clerk
        lang={lang}
        page="passport"
        cue="passport:issued"
        say={t(lang, "sayPassportIssued")}
        cta={{ label: t(lang, "ctaCustoms"), to: "/verify" }}
      />
      <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-8 gap-y-8 items-start">
        {/* 1. The passport card */}
        <section className="panel border-gold/50 p-6 md:p-7" aria-label={t(lang, "passportCardLabel")}>
          <p className="sticker">{t(lang, "synthetic").split("—")[0]}</p>
          <h2 className="font-display italic text-3xl mt-5 leading-tight">{title}</h2>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest opacity-50">
            {who} · {t(lang, "passportConsentTag")}
          </p>
          <div className="mt-6">
            <p className="label">{t(lang, "passportHashLabel")}</p>
            <p className="mt-3 font-mono text-sm flex flex-wrap items-center gap-x-3 gap-y-1" title={hash}>
              <span>{shortHash(hash)}</span>
              <button type="button" className="underline text-xs" onClick={copy}>
                {copied ? t(lang, "copied") : t(lang, "copyHash")}
              </button>
            </p>
          </div>
          <div className="mt-6">
            <p className="label">{t(lang, "passportStampsLabel")}</p>
            <div className="mt-3">
              <BadgeShelf names={(data.badges || []).map((b) => b.badge.name)} />
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {/* 2. The score, and 3. why that number */}
          <section className="panel border-gold/50 p-6 md:p-7">
            <ScoreRing value={data.score.score} label={t(lang, "health")} />
            <p className="text-center mt-4">
              <button type="button" className="underline text-sm" aria-expanded={why} onClick={() => setWhy(!why)}>
                {t(lang, "whyScore")}
              </button>
            </p>
            {why && (
              <ul className="mt-4 space-y-2 border-t hair pt-4 max-h-80 overflow-y-auto pr-2">
                {data.score.reasons.map((r) => (
                  <li key={r.event_id} className="font-mono text-[11px] leading-snug">
                    {r.event_id}: {r.points > 0 ? "+" : ""}{r.points} — {r.why}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 4. Next best steps */}
          <section className="panel border-gold/50 p-6 md:p-7">
            <p className="label">{t(lang, "next")}</p>
            <ul className="list-disc ml-5 text-sm mt-4 space-y-2">
              {data.score.next_best_steps.map((s) => <li key={s}>{s}</li>)}
            </ul>
          </section>
        </div>
      </div>

      {/* 5. What to do next */}
      <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
        <NextStamp to="/financier">{t(lang, "nextFinancier")}</NextStamp>
        <Link to="/passport" className="underline text-sm opacity-80 hover:opacity-100 mt-8">
          {t(lang, "passportBackToRegister")}
        </Link>
      </div>
    </Room>
  );
}
