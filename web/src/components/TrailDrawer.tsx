import type { Flag } from "../api";
import { t, type Lang } from "../i18n";

export function TrailDrawer({ flag, lang, onClose }: { flag: Flag; lang: Lang; onClose: () => void }) {
  const title = lang === "sw" ? flag.title_sw : flag.title_en;
  const meaning = lang === "sw" ? flag.meaning_sw : flag.meaning_en;
  const cost = lang === "sw" ? flag.cost_sw : flag.cost_en;
  const icon = flag.severity === "red" ? "▲" : "■";
  return (
    <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-paper dark:bg-ink shadow-2xl p-6 overflow-y-auto z-20 border-l border-ink/10"
      role="dialog" aria-labelledby="trail-title">
      <button type="button" className="text-sm underline" onClick={onClose}>Close</button>
      <p className="mt-4 text-xs uppercase tracking-widest text-ink/50">{flag.rule_id} · clause {flag.clause}</p>
      <h2 id="trail-title" className="font-display text-2xl mt-1">
        <span aria-hidden="true">{icon} </span>
        {title}
        <span className="sr-only"> ({flag.severity})</span>
      </h2>
      <p className="mt-4 leading-relaxed">{meaning}</p>
      <p className="mt-3 text-sm"><strong>{t(lang, "cost")}:</strong> {cost}</p>
      <ol className="mt-6 space-y-3">
        {flag.trail.map((line, i) => (
          <li key={i} className="border-l-2 border-savanna pl-3 text-sm">
            <p className="font-medium">{line.rule_id}</p>
            <p>{lang === "sw" ? line.text_sw : line.text_en}</p>
          </li>
        ))}
      </ol>
    </aside>
  );
}
