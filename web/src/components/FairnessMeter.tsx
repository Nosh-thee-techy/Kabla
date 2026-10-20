import { useState } from "react";
import type { Readiness } from "../api";
import { t, type Lang } from "../i18n";

/** One-line flag summary. The clause map already paints every flag; the list stays folded. */
export function FairnessMeter({ lang, data }: { lang: Lang; data: Readiness["fairness"] }) {
  const [open, setOpen] = useState(false);
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold">
          {t(lang, "fairness")}
        </p>
        <p className="font-display italic text-lg">{fairnessLine(lang, data)}</p>
        {data.flags.length > 0 && (
          <button type="button" className="underline text-xs opacity-70" onClick={() => setOpen(!open)}>
            {open ? t(lang, "hideList") : t(lang, "flagList")}
          </button>
        )}
      </div>
      {open && (
        <ul className="mt-2 space-y-1 text-xs">
          {data.flags.map((f) => (
            <li key={`${f.rule_id}-${f.clause}`} className="flex gap-2">
              <span className={`seal ${f.severity === "red" ? "seal-red" : "seal-amber"}`}>{f.clause}</span>
              <span className="self-center">
                <span className="font-mono">{f.rule_id}</span>
                {" — "}
                {lang === "sw" ? f.title_sw : f.title_en}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function fairnessLine(lang: Lang, data: Readiness["fairness"]): string {
  const names = data.fair_topics.slice(0, 2).map((topic) => topic.replace(/-/g, " "));
  const fair = names.length === 0
    ? t(lang, "noCleanTopic")
    : `${t(lang, "fairOn")} ${names.join(lang === "sw" ? " na " : " and ")}`;
  return `${data.red} ${t(lang, "red")}, ${data.amber} ${t(lang, "amber")}, ${fair}`;
}
