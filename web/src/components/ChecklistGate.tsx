import type { ChecklistItem } from "../api";
import { t, type Lang } from "../i18n";

export function ChecklistGate({ lang, items }: { lang: Lang; items: ChecklistItem[] }) {
  return (
    <section className="panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold">
        {t(lang, "checklist")}
      </p>
      <p className="text-xs opacity-70 mt-1">{t(lang, "checklistNote")}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.key} className="text-sm">
            <p>
              <span className={`seal ${item.ok ? "seal-green" : "seal-amber"} mr-2`} aria-hidden="true">
                {item.ok ? "✓" : "!"}
              </span>
              {lang === "sw" ? item.label_sw : item.label_en}
            </p>
            {!item.ok && (
              <p className="mt-1 ml-10 text-xs text-flag-amber">
                {lang === "sw" ? item.warning_sw : item.warning_en}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
