import type { Lang } from "../i18n";

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex border hair rounded-sm" role="group" aria-label="Language">
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`px-2.5 py-1 font-mono text-[11px] tracking-widest ${lang === l ? "bg-savanna text-paper" : "opacity-70"}`}
        >
          {l === "en" ? "EN" : "SW"}
        </button>
      ))}
    </div>
  );
}
