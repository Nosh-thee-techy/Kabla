import type { Lang } from "../i18n";

export function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex rounded-full border border-ink/20 p-0.5" role="group" aria-label="Language">
      {(["en", "sw"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`px-3 py-1 text-sm rounded-full ${lang === l ? "bg-savanna text-paper" : "text-ink/70"}`}
        >
          {l === "en" ? "EN" : "SW"}
        </button>
      ))}
    </div>
  );
}
