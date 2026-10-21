import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type AudienceView } from "../api";
import { t, tf, type Lang } from "../i18n";

const nf = (lang: Lang, n: number) => n.toLocaleString(lang === "sw" ? "sw-KE" : "en-KE");

/** Why this card exists: a backer sees reach next to the Rights check. It is the musician's own typed numbers,
 *  labelled "Self-reported, not verified" every time, worked out by plain arithmetic in the API (no model), and it
 *  never touches the Rights check number. `profileId` is the musician's profile id (not the demo artist). */
export function AudienceCard({ lang, profileId }: { lang: Lang; profileId: string }) {
  const [view, setView] = useState<AudienceView | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setView(null); setFailed(false);
    api.audience(profileId).then(setView).catch(() => setFailed(true));
  }, [profileId]);

  const a = view?.audience;
  const s = a?.summary;
  const th = s?.thresholds;
  const fmtLift = th ? nf(lang, th.growing_reach_with_engagement) : "";

  return (
    <section className="panel border-gold/50 p-6 md:p-7" aria-label={t(lang, "audCardTitle")} data-testid="audience-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="label">{t(lang, "audCardTitle")}</p>
        <span className="sticker">{t(lang, "audSelf")}</span>
      </div>

      {!a || !s ? (
        <div className="mt-4 text-sm">
          <p className="opacity-80">{failed ? t(lang, "audNone") : view ? t(lang, "audNone") : "…"}</p>
          {view && <p className="mt-2"><Link to="/onboard" className="underline">{t(lang, "audAdd")} →</Link></p>}
        </div>
      ) : (
        <>
          <dl className="ledger mt-4">
            <div><dt>{t(lang, "audReach")}</dt><dd data-testid="aud-reach">{nf(lang, s.total_reach)}</dd></div>
            <div>
              <dt>{t(lang, "audRate")}</dt>
              <dd data-testid="aud-rate">
                {s.engagement_rate_pct != null
                  ? `${s.engagement_rate_pct}%`
                  : <span className="text-xs opacity-70">{t(lang, s.check_numbers ? "audRateCheck" : "audRateNone")}</span>}
              </dd>
            </div>
            <div><dt>{t(lang, "audBand")}</dt><dd data-testid="aud-band"><b>{t(lang, `audBand_${s.band}` as const)}</b></dd></div>
          </dl>
          {a.note && <p className="text-sm mt-3"><span className="opacity-60">{t(lang, "audNoteIs")}: </span>{a.note}</p>}

          <details className="mt-4 text-sm">
            <summary className="cursor-pointer underline opacity-90">{t(lang, "audHow")}</summary>
            <ul className="mt-2 space-y-1.5 text-xs leading-snug opacity-90 list-disc ml-5">
              <li>{tf(lang, "audHowReach", { reach: nf(lang, s.total_reach) })}</li>
              {s.engagement_rate_pct != null && a.avg_likes != null && (
                <li>{tf(lang, "audHowRate", { likes: nf(lang, a.avg_likes), followers: nf(lang, s.social_followers), rate: s.engagement_rate_pct })}</li>
              )}
              {th && (
                <li>{tf(lang, "audHowBand", {
                  growing: nf(lang, th.growing_reach), established: nf(lang, th.established_reach),
                  strong: th.strong_engagement_pct, lift: fmtLift,
                })}</li>
              )}
              {s.held_back_by_engagement && th && <li>{tf(lang, "audHowHeld", { low: th.low_engagement_pct })}</li>}
            </ul>
          </details>
        </>
      )}
      <p className="text-xs opacity-70 mt-4">{t(lang, "audNotMoney")}</p>
    </section>
  );
}
