import type { AudienceInput } from "../api";
import { t, type Lang } from "../i18n";

export const AUDIENCE_PLATFORMS = ["instagram", "tiktok", "facebook", "spotify", "youtube"] as const;

/** What the form holds while the musician types. Strings, so a half-typed number never breaks the input. */
export type AudienceForm = { followers: Record<string, string>; likes: string; note: string };
export const emptyAudience: AudienceForm = { followers: {}, likes: "", note: "" };

/** Turn the typed strings into the API body. Returns undefined when nothing was typed. Only whole numbers count. */
export function audienceBody(f: AudienceForm): AudienceInput | undefined {
  const followers: Record<string, number> = {};
  for (const [k, v] of Object.entries(f.followers)) {
    const n = Number.parseInt(v.replace(/[\s,]/g, ""), 10);
    if (Number.isFinite(n) && n > 0) followers[k] = n;
  }
  const likes = Number.parseInt(f.likes.replace(/[\s,]/g, ""), 10);
  const out: AudienceInput = { followers };
  if (Number.isFinite(likes) && likes > 0) out.avg_likes = likes;
  if (f.note.trim()) out.note = f.note.trim();
  return Object.keys(followers).length || out.avg_likes || out.note ? out : undefined;
}

/** The demo musician's invented numbers, for the "Fill in the demo" button. */
export const demoAudience: AudienceForm = {
  followers: { instagram: "4200", tiktok: "800", spotify: "1500" },
  likes: "150",
  note: "Most listeners are in Nairobi.",
};

/** Typed numbers only. Shown in the You room and in step 2 of the set-up. Kabla never opens these accounts. */
export function AudienceFields({ lang, value, onChange }: { lang: Lang; value: AudienceForm; onChange: (v: AudienceForm) => void }) {
  return (
    <fieldset data-testid="audience-fields">
      <legend className="label">{t(lang, "audTitle")}</legend>
      <p className="text-xs opacity-70 mt-1">{t(lang, "audLead")}</p>
      <p className="sticker mt-2 inline-block">{t(lang, "audSelf")}</p>
      <p className="text-xs opacity-60 mt-2">{t(lang, "audNoScrape")}</p>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        {AUDIENCE_PLATFORMS.map((p) => {
          const label = t(lang, `audPlat_${p}` as const);
          return (
            <label key={p} className="block">
              <span className="text-xs opacity-80">{label}</span>
              <input
                className="mt-0.5 w-full border hair bg-transparent px-2 py-1.5 text-sm"
                inputMode="numeric" autoComplete="off" maxLength={12} data-aud={p}
                value={value.followers[p] ?? ""}
                onChange={(e) => onChange({ ...value, followers: { ...value.followers, [p]: e.target.value.replace(/[^\d\s,]/g, "") } })}
              />
            </label>
          );
        })}
        <label className="block">
          <span className="text-xs opacity-80">{t(lang, "audLikes")}</span>
          <input
            className="mt-0.5 w-full border hair bg-transparent px-2 py-1.5 text-sm"
            inputMode="numeric" autoComplete="off" maxLength={12} data-aud="likes"
            value={value.likes}
            onChange={(e) => onChange({ ...value, likes: e.target.value.replace(/[^\d\s,]/g, "") })}
          />
        </label>
      </div>
      <label className="block mt-2">
        <span className="text-xs opacity-80">{t(lang, "audNote")}</span>
        <input
          className="ph-dim mt-0.5 w-full border hair bg-transparent px-2 py-1.5 text-sm"
          maxLength={300} placeholder={t(lang, "audNotePh")} data-aud="note"
          value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })}
        />
      </label>
    </fieldset>
  );
}
