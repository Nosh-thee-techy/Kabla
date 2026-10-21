import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { AudienceCard } from "../components/AudienceCard";
import { BadgeShelf } from "../components/BadgeShelf";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { ScoreRing } from "../components/ScoreRing";
import { shortHash } from "../lib/format";
import { t, type Lang } from "../i18n";
import { plainStep, reasonWords } from "../plain";
import { useArtist, useKabla } from "../state";

/** Before stage, step 3: holding what was issued, BEFORE any contract. Fixed order, top to bottom:
 *  the work passport card and the next best steps, then two separate readings side by side: the Rights check
 *  (who owns the work, from the API's rules) and the Audience credibility card (typed by the musician, unverified).
 *  The register form lives on /passport. On opening, the stored passport is refreshed from the API so stamps and the
 *  Rights check earned in later steps show up here. */
export function PassportIssued({ lang }: { lang: Lang }) {
  const { passport: data, setPassport, profile } = useKabla();
  const artist = useArtist();
  const [why, setWhy] = useState(false);
  const [copied, setCopied] = useState(false);

  // Keep the certificate we hold; take the fresh score and badges (they grow after the contract steps).
  useEffect(() => {
    if (!data) return;
    api.getPassport(artist)
      .then((fresh) => setPassport({ ...data, badges: fresh.badges, score: fresh.score }))
      .catch(() => { /* keep what we have */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist]);

  const header = (
    <div className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "groupBefore")} · {t(lang, "regBeforeTag")}</p>
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
        cta={{ label: t(lang, "ppNextDesk"), to: "/desk" }}
      />
      <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-8 gap-y-8 items-start">
        {/* 1. The work passport card */}
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
              <BadgeShelf lang={lang} names={(data.badges || []).map((b) => b.badge.name)} />
            </div>
            <p className="text-xs opacity-60 mt-3">{t(lang, "ppLater")}</p>
          </div>
        </section>

        {/* 2. Next best steps */}
        <section className="panel border-gold/50 p-6 md:p-7">
          <p className="label">{t(lang, "next")}</p>
          <ul className="list-disc ml-5 text-sm mt-4 space-y-2">
            {data.score.next_best_steps.map((s) => <li key={s}>{plainStep(lang, s)}</li>)}
          </ul>
        </section>
      </div>

      {/* 3. Two separate readings, side by side */}
      <p className="mt-10 text-sm opacity-80 max-w-3xl">{t(lang, "audSeparate")}</p>
      <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-8 gap-y-8 items-start">
        <section className="panel border-gold/50 p-6 md:p-7" data-testid="rights-card">
          <ScoreRing value={data.score.score} label={t(lang, "health")} />
          <p className="text-center mt-4">
            <button type="button" className="underline text-sm" aria-expanded={why} onClick={() => setWhy(!why)}>
              {t(lang, "whyScore")}
            </button>
          </p>
          {why && (
            <div className="mt-4 border-t hair pt-4 max-h-80 overflow-y-auto pr-2">
              <ul className="space-y-2">
                {data.score.reasons.map((r) => (
                  <li key={r.event_id} className="text-sm leading-snug flex gap-3">
                    <b className="font-mono shrink-0">{r.points > 0 ? "+" : ""}{r.points}</b>
                    <span>{reasonWords(lang, r)}</span>
                  </li>
                ))}
              </ul>
              <details className="mt-4 text-xs">
                <summary className="cursor-pointer underline opacity-80">{t(lang, "detailsFold")}</summary>
                <ul className="mt-2 space-y-1 font-mono text-[11px] leading-snug opacity-80">
                  {data.score.reasons.map((r) => (
                    <li key={r.event_id}>{r.event_id}: {r.points > 0 ? "+" : ""}{r.points} — {r.why}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </section>
        <AudienceCard lang={lang} profileId={profile?.id ?? artist} />
      </div>

      <aside className="guide-card p-4 text-sm max-w-2xl mt-8" aria-label={t(lang, "regNftTitle")} data-testid="nft-roadmap">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{t(lang, "regNftTitle")}</p>
        <p className="mt-1.5 leading-snug">{t(lang, "regNftBody")}</p>
        <p className="mt-1.5 text-xs opacity-75 leading-snug">{t(lang, "regNftNow")}</p>
      </aside>

      {/* 4. What to do next */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <NextStamp to="/desk">{t(lang, "ppNextDesk")}</NextStamp>
        <Link to="/passport" className="underline text-sm opacity-80 hover:opacity-100 mt-8">
          {t(lang, "passportBackToRegister")}
        </Link>
      </div>
    </Room>
  );
}
