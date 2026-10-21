import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, type Profile } from "../api";
import { Room } from "../components/Room";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";
import { gapText } from "./Onboard";
import "../landing.css";

const PLATFORMS = ["instagram", "facebook", "tiktok", "spotify", "youtube"] as const;

/** Set-up wizard after the demo sign-in: About you -> Where your music lives -> Your catalogue -> Ready.
 *  It is the You room (pages/Onboard.tsx) cut into three short steps. The final step makes the SAME call the You
 *  room makes (api.createArtist) and stores the SAME Profile (setProfile), so the Desk, the seal check and every
 *  later room behave identically. Typed text only: Kabla never opens the links. */
export function Onboarding({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { account, setAccount, profile, setProfile } = useKabla();
  const nav = useNavigate();
  const [step, setStep] = useState(profile && account?.onboarded ? 3 : 0);
  const [name, setName] = useState(account?.name ?? "");
  const [artist, setArtist] = useState("");
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [bio, setBio] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [seal, setSeal] = useState<{ intact: boolean; records: number } | null>(null);
  const head = useRef<HTMLHeadingElement>(null);

  // Move focus to the step heading when the step changes, so a keyboard or screen-reader user lands on the new step.
  useEffect(() => { head.current?.focus(); }, [step]);

  if (!account) return <Navigate to="/signin" replace />;

  const labels = ["wzS1", "wzS2", "wzS3", "wzReady"] as const;

  function fillDemo() {
    setArtist("Zawadi");
    setHandles({ instagram: "@zawadi_synth", tiktok: "@zawadi.synth" });
    setBio("Singer-songwriter in Nairobi. \"Asali ya Jioni\" is 60% mine, 40% Baraka's. Income: streaming and live shows.");
  }

  function next() {
    setErr(null);
    if (step === 0 && !name.trim()) { setErr(t(lang, "wzNeedName")); return; }
    setStep(step + 1);
  }

  async function finish() {
    if (!consent) { setErr(t(lang, "onbNeedConsent")); return; }
    setBusy(true); setErr(null); setSeal(null);
    try {
      const p: Profile = await api.createArtist({
        name: artist.trim() || name.trim() || "Artist", handles, consent, bio, lang,
      });
      setProfile(p);
      setAccount({ ...account!, name: name.trim() || account!.name, onboarded: true });
      setStep(3);
    } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
    finally { setBusy(false); }
  }

  async function checkSeal() {
    if (!profile) return;
    try { setSeal(await api.verifySeal(profile.id)); } catch (e) { setErr(String(e)); }
  }

  const linkCount = profile ? Object.values(profile.handles ?? {}).filter((v) => v && v.trim()).length : 0;

  return (
    <Room>
      <div className="max-w-3xl w-full mx-auto pt-2 md:pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "groupBefore")}</p>
        <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-tight">{t(lang, "wzTitle")}</h1>
        <p className="mt-2 text-sm opacity-80 max-w-2xl">{t(lang, "wzLead")}</p>

        <nav aria-label={t(lang, "wzTitle")} className="mt-5">
          <p className="font-mono text-[11px] tracking-wider opacity-80" role="status">
            {step < 3 ? tf(lang, "wzProgress", { n: step + 1 }) : t(lang, "wzReady")}
          </p>
          <div className="wz-bar mt-2" aria-hidden="true"><div style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
          <ol className="wz-prog mt-3">
            {labels.map((k, i) => (
              <li key={k} className={i < step ? "done" : ""} aria-current={i === step ? "step" : undefined}>
                <span>{String(i + 1).padStart(2, "0")}</span>{t(lang, k)}
              </li>
            ))}
          </ol>
        </nav>

        <div className="panel mt-6 p-5 md:p-6">
          {step === 0 && (
            <section>
              <h2 ref={head} tabIndex={-1} className="font-display italic text-2xl outline-none">{t(lang, "wzS1")}</h2>
              <p className="text-sm opacity-80 mt-1">{t(lang, "wzS1Lead")}</p>
              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="label">{t(lang, "onbName")}</span>
                  <input className="mt-1 w-full border hair bg-transparent px-3 py-2" value={name} maxLength={80}
                         onChange={(e) => { setName(e.target.value); setErr(null); }} />
                </label>
                <label className="block">
                  <span className="label">{t(lang, "wzArtist")}</span>
                  <p className="text-xs opacity-60 mt-1">{t(lang, "wzArtistHint")}</p>
                  <input className="mt-1 w-full border hair bg-transparent px-3 py-2" value={artist} maxLength={80}
                         onChange={(e) => setArtist(e.target.value)} />
                </label>
                <fieldset>
                  <legend className="label">{t(lang, "wzLang")}</legend>
                  <p className="text-xs opacity-60 mt-1">{t(lang, "wzLangHint")}</p>
                  <div className="wz-lang mt-2 relative">
                    {(["en", "sw"] as const).map((l) => (
                      <label key={l}>
                        <input type="radio" name="wz-lang" value={l} checked={lang === l} onChange={() => setLang(l)} />
                        <span>{t(lang, l === "en" ? "wzLangEn" : "wzLangSw")}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>
            </section>
          )}

          {step === 1 && (
            <section>
              <h2 ref={head} tabIndex={-1} className="font-display italic text-2xl outline-none">{t(lang, "wzS2")}</h2>
              <p className="text-sm opacity-80 mt-1">{t(lang, "onbHandlesHint")} {t(lang, "wzS2Lead")}</p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                {PLATFORMS.map((p) => (
                  <label key={p} className="block">
                    <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">{p}</span>
                    <input className="ph-dim mt-0.5 w-full border hair bg-transparent px-2 py-1.5 text-sm" value={handles[p] ?? ""}
                           maxLength={80} placeholder={t(lang, "wzHandlePh")}
                           onChange={(e) => setHandles({ ...handles, [p]: e.target.value })} />
                  </label>
                ))}
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 ref={head} tabIndex={-1} className="font-display italic text-2xl outline-none">{t(lang, "wzS3")}</h2>
              <p className="text-sm opacity-80 mt-1">{t(lang, "wzS3Lead")}</p>
              <form className="mt-4 space-y-4" onSubmit={(e) => { e.preventDefault(); void finish(); }}>
                <label className="block">
                  <span className="label">{t(lang, "onbBio")}</span>
                  <p className="text-xs opacity-60 mt-1">{t(lang, "onbBioHint")}</p>
                  <textarea className="ph-dim mt-1 w-full border hair bg-transparent px-3 py-2 text-sm min-h-[120px]" value={bio}
                            maxLength={4000} placeholder={t(lang, "wzBioPh")} onChange={(e) => setBio(e.target.value)} />
                </label>
                <button type="button" className="stamp stamp-ghost" onClick={fillDemo}>{t(lang, "onbDemo")}</button>
                <label className="flex gap-2 items-start text-sm">
                  <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span>{t(lang, "onbConsent")}</span>
                </label>
                <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">{t(lang, "onbSubmit")}</button>
              </form>
            </section>
          )}

          {step === 3 && profile && (
            <section aria-live="polite">
              <h2 ref={head} tabIndex={-1} className="font-display italic text-2xl outline-none">
                {tf(lang, "wzReadyTitle", { name: account.name })}
              </h2>
              <p className="text-sm opacity-80 mt-1">{t(lang, "wzReadyLead")}</p>
              <p className="text-xs opacity-70 mt-1">{t(lang, "onbSelf")}</p>
              <dl className="ledger mt-4">
                <div><dt>{t(lang, "wzSumName")}</dt><dd>{account.name}</dd></div>
                <div><dt>{t(lang, "wzSumArtist")}</dt><dd>{profile.name}</dd></div>
                <div><dt>{t(lang, "wzSumLang")}</dt><dd>{t(lang, lang === "en" ? "wzLangEn" : "wzLangSw")}</dd></div>
                <div><dt>{t(lang, "wzSumLinks")}</dt><dd>{linkCount ? tf(lang, "wzLinksCount", { n: linkCount }) : t(lang, "wzNone")}</dd></div>
                {profile.facts.works.length === 0 && (
                  <div><dt>{t(lang, "onbWorks")}</dt><dd>{t(lang, "onbNoWorks")}</dd></div>
                )}
                {profile.facts.works.map((w) => (
                  <div key={w.title}>
                    <dt>{w.title}</dt>
                    <dd>{w.splits_stated && w.share != null ? tf(lang, "onbSplit", { n: w.share }) : t(lang, "onbSplitMissing")}</dd>
                  </div>
                ))}
              </dl>
              <p className="label mt-5">{t(lang, "onbGaps")}</p>
              {profile.gaps.length === 0
                ? <p className="mt-2 text-sm">{t(lang, "onbNoGaps")}</p>
                : (
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {profile.gaps.map((g, i) => (
                      <li key={`${g.id}-${i}`} className="flex gap-2 items-baseline">
                        <span className="seal seal-amber !w-5 !h-5 !text-[10px] shrink-0">!</span>
                        <span>{gapText(lang, g)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              <p className="label mt-5">{t(lang, "onbSeal")}</p>
              <p className="font-mono text-[11px] mt-1 break-all opacity-80">#{profile.seal.seq} · {profile.seal.record_hash}</p>
              <button type="button" className="stamp stamp-ghost mt-2" onClick={() => void checkSeal()}>{t(lang, "onbCheckSeal")}</button>
              {seal && (
                <p className={`mt-2 text-sm ${seal.intact ? "text-[#8FCFB8]" : "text-[#F0A39C]"}`} role="status">
                  {seal.intact ? t(lang, "onbSealOk") : t(lang, "onbSealBad")} ({seal.records})
                </p>
              )}
            </section>
          )}

          {err && <p className="text-[#F0A39C] text-sm mt-4" role="alert">{err}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t hair">
            {step === 3 ? (
              <>
                <button type="button" className="stamp stamp-terracotta" onClick={() => nav("/desk")}>{t(lang, "wzOpenDesk")}</button>
                <Link to="/onboard" className="underline text-sm">{t(lang, "wzEditYou")}</Link>
              </>
            ) : (
              <>
                {step > 0 && (
                  <button type="button" className="stamp stamp-ghost" onClick={() => { setErr(null); setStep(step - 1); }}>
                    {t(lang, "wzBack")}
                  </button>
                )}
                {step < 2 && <button type="button" className="stamp stamp-terracotta" onClick={next}>{t(lang, "wzNext")}</button>}
                {step === 2 && (
                  <button type="button" className="stamp stamp-terracotta" disabled={busy} onClick={() => void finish()}>
                    {busy ? t(lang, "onbWorking") : t(lang, "onbSubmit")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Room>
  );
}
