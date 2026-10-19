import type { Flag } from "../api";
import { t, type Lang } from "../i18n";

export function TrailBody({ flag, lang }: { flag: Flag; lang: Lang }) {
  const title = lang === "sw" ? flag.title_sw : flag.title_en;
  const meaning = lang === "sw" ? flag.meaning_sw : flag.meaning_en;
  const cost = lang === "sw" ? flag.cost_sw : flag.cost_en;
  const red = flag.severity === "red";
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-widest opacity-60">
        {flag.rule_id} · clause {flag.clause}
      </p>
      <h2 id="trail-title" className="font-display italic text-2xl mt-2">
        <span className={`seal ${red ? "seal-red" : "seal-amber"} mr-2 align-middle`} aria-hidden="true">
          {red ? "▲" : "■"}
        </span>
        {title}
        <span className="sr-only"> ({flag.severity})</span>
      </h2>
      <p className="mt-4 leading-relaxed">{meaning}</p>
      <p className="mt-4 font-display italic text-terracotta">
        <strong className="not-italic font-sans text-xs uppercase tracking-widest block opacity-70">{t(lang, "cost")}</strong>
        {cost}
      </p>
      <ol className="mt-6 space-y-3">
        {flag.trail.map((line, i) => (
          <li key={i} className="border-l-2 border-gold pl-3 text-sm">
            <p className="font-mono text-[11px]">{line.rule_id}</p>
            <p className="mt-0.5">{lang === "sw" ? line.text_sw : line.text_en}</p>
          </li>
        ))}
      </ol>
    </>
  );
}

export function TrailDrawer({ flag, lang, onClose }: { flag: Flag; lang: Lang; onClose: () => void }) {
  return (
    <aside
      className="fixed inset-0 z-20 md:hidden bg-dusk text-lamp p-6 overflow-y-auto"
      role="dialog"
      aria-labelledby="trail-title"
    >
      <button type="button" className="text-sm underline" onClick={onClose}>Close</button>
      <div className="mt-6">
        <TrailBody flag={flag} lang={lang} />
      </div>
    </aside>
  );
}
