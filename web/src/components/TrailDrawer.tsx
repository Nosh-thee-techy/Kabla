import type { Flag } from "../api";
import { t, tf, type Lang } from "../i18n";
import { plainFlag, plainRedline } from "../plain";

/** One flag, in plain words first. The engine's own wording (rule id, trail lines) is kept, one tap away,
 *  under "Show the exact rule", so nothing the engine said is hidden or changed. */
export function TrailBody({ flag, lang }: { flag: Flag; lang: Lang }) {
  const words = plainFlag(lang, flag);
  const red = flag.severity === "red";
  const redlineSentence = plainRedline(lang, flag);
  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-widest opacity-60">
        {flag.clause > 0 ? tf(lang, "cardClause", { n: flag.clause }) : t(lang, "trailWhy")}
        {" · "}{red ? t(lang, "redExplain") : t(lang, "amberExplain")}
      </p>
      {flag.redline_set_on && (
        <p className="sticker mt-3">{redlineSentence ?? `${t(lang, "youSetThis")} ${flag.redline_set_on}`}</p>
      )}
      <h2 id="trail-title" className="font-display italic text-2xl mt-2">
        <span className={`seal ${red ? "seal-red" : "seal-amber"} mr-2 align-middle`} aria-hidden="true">
          {red ? "▲" : "■"}
        </span>
        {words.title}
        <span className="sr-only"> ({flag.severity})</span>
      </h2>
      <p className="mt-4 leading-relaxed">{words.meaning}</p>
      <p className="mt-4 font-display italic text-terracotta">
        <strong className="not-italic font-sans text-xs uppercase tracking-widest block opacity-70">{t(lang, "cost")}</strong>
        {words.cost}
      </p>
      <details className="mt-6 text-xs">
        <summary className="cursor-pointer underline opacity-80">{t(lang, "detailsFold")}</summary>
        <p className="mt-3 font-mono text-[11px] opacity-70">{flag.rule_id}</p>
        {words.plain && (
          <p className="mt-1 opacity-80">
            {lang === "sw" ? flag.title_sw : flag.title_en} — {lang === "sw" ? flag.meaning_sw : flag.meaning_en}
          </p>
        )}
        <ol className="mt-3 space-y-3">
          {flag.trail.map((line, i) => (
            <li key={i} className="border-l-2 border-gold pl-3">
              <p className="font-mono text-[11px]">{line.rule_id}</p>
              <p className="mt-0.5">{lang === "sw" ? line.text_sw : line.text_en}</p>
            </li>
          ))}
        </ol>
      </details>
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
      <button type="button" className="text-sm underline" onClick={onClose}>{t(lang, "close")}</button>
      <div className="mt-6">
        <TrailBody flag={flag} lang={lang} />
      </div>
    </aside>
  );
}
