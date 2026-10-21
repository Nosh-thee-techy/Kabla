import { useState } from "react";
import { api, type Profile, type ProfileGap } from "../api";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";

const PLATFORMS = ["instagram", "facebook", "tiktok", "spotify", "youtube"] as const;

/** Plain-language line for each gap id MeTTa can return (engine/profile.metta). */
export function gapText(lang: Lang, g: ProfileGap): string {
  switch (g.id) {
    case "splits-unstated": return tf(lang, "gapSplitsUnstated", { detail: g.detail });
    case "no-works-listed": return t(lang, "gapNoWorks");
    case "no-handles": return t(lang, "gapNoHandles");
    case "ai-stance-unset": return t(lang, "gapAiStance");
    default: return g.id;
  }
}

/** Before stage. Why it exists: the contract rooms start from a person, not a folder. Everything typed
 *  here is self-declared; nothing is fetched from any platform; the seal proves the text did not change. */
export function Onboard({ lang }: { lang: Lang }) {
  const { profile, setProfile } = useKabla();
  const [name, setName] = useState("");
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [bio, setBio] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [seal, setSeal] = useState<{ intact: boolean; records: number } | null>(null);

  function fillDemo() {
    setName("Zawadi");
    setHandles({ instagram: "@zawadi_synth", tiktok: "@zawadi.synth" });
    setBio("Singer-songwriter in Nairobi. \"Asali ya Jioni\" is 60% mine, 40% Baraka's. Income: streaming and live shows.");
  }

  async function submit() {
    if (!consent) { setErr(t(lang, "onbNeedConsent")); return; }
    setBusy(true); setErr(null); setSeal(null);
    try {
      const p: Profile = await api.createArtist({ name: name || "Artist", handles, consent, bio, lang });
      setProfile(p);
    } catch (e) { setErr(String(e instanceof Error ? e.message : e)); }
    finally { setBusy(false); }
  }

  async function checkSeal() {
    if (!profile) return;
    try { setSeal(await api.verifySeal(profile.id)); } catch (e) { setErr(String(e)); }
  }

  return (
    <Room>
      <div className="pb-3 border-b hair">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "groupBefore")}</p>
        <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-tight">{t(lang, "onbTitle")}</h1>
        <p className="mt-2 text-sm opacity-80 max-w-2xl">{t(lang, "onbLead")}</p>
      </div>
      <Clerk
        lang={lang}
        page="onboard"
        cue={profile ? "onboard:done" : "onboard"}
        say={t(lang, profile ? "sayOnboardDone" : "sayOnboard")}
        cta={profile ? { label: t(lang, "ctaToDesk"), to: "/desk" } : { label: t(lang, "ctaOnbDemo"), onClick: fillDemo }}
      />

      <div className="mt-5 grid lg:grid-cols-2 gap-x-10 gap-y-6 items-start">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <label className="block">
            <span className="label">{t(lang, "onbName")}</span>
            <input className="mt-1 w-full border hair bg-transparent px-3 py-2" value={name} maxLength={80}
                   onChange={(e) => setName(e.target.value)} />
          </label>
          <fieldset>
            <legend className="label">{t(lang, "onbHandles")}</legend>
            <p className="text-xs opacity-60 mt-1">{t(lang, "onbHandlesHint")}</p>
            <div className="mt-2 grid sm:grid-cols-2 gap-2">
              {PLATFORMS.map((p) => (
                <label key={p} className="block">
                  <span className="font-mono text-[10px] uppercase tracking-wider opacity-70">{p}</span>
                  <input className="mt-0.5 w-full border hair bg-transparent px-2 py-1.5 text-sm" value={handles[p] ?? ""}
                         maxLength={80} onChange={(e) => setHandles({ ...handles, [p]: e.target.value })} />
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="label">{t(lang, "onbBio")}</span>
            <p className="text-xs opacity-60 mt-1">{t(lang, "onbBioHint")}</p>
            <textarea className="mt-1 w-full border hair bg-transparent px-3 py-2 text-sm min-h-[110px]" value={bio}
                      maxLength={4000} onChange={(e) => setBio(e.target.value)} />
          </label>
          <label className="flex gap-2 items-start text-sm">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>{t(lang, "onbConsent")}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="stamp stamp-terracotta" disabled={busy}>
              {busy ? t(lang, "onbWorking") : t(lang, "onbSubmit")}
            </button>
            <button type="button" className="stamp stamp-ghost" onClick={fillDemo}>{t(lang, "onbDemo")}</button>
          </div>
          {err && <p className="text-flag-red text-sm" role="alert">{err}</p>}
        </form>

        {profile && (
          <section aria-live="polite">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "onbDone")}</p>
            <h2 className="font-display italic text-2xl mt-1">{profile.name}</h2>
            <p className="text-xs opacity-70 mt-1">{t(lang, "onbSelf")}</p>
            <p className="label mt-5">{t(lang, "onbWorks")}</p>
            <dl className="ledger mt-2">
              {profile.facts.works.length === 0 && <dd className="text-sm opacity-60">{t(lang, "onbNoWorks")}</dd>}
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
              <p className={`mt-2 text-sm ${seal.intact ? "text-savanna" : "text-flag-red"}`} role="status">
                {seal.intact ? t(lang, "onbSealOk") : t(lang, "onbSealBad")} ({seal.records})
              </p>
            )}
            <NextStamp to="/desk">{t(lang, "onbNext")}</NextStamp>
          </section>
        )}
      </div>
    </Room>
  );
}
