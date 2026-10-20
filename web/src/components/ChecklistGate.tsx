import type { ChecklistItem } from "../api";
import { t, type Lang } from "../i18n";

export function ChecklistGate({ lang, items }: { lang: Lang; items: ChecklistItem[] }) {
  return (
    <section>
      <p className="label">{t(lang, "checklist")}</p>
      <p className="text-xs opacity-70 mt-1.5">{t(lang, "checklistNote")}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.key} className="text-sm">
            <p className="flex items-center gap-2">
              <span className={`seal ${item.ok ? "seal-green" : "seal-amber"} !w-5 !h-5 !text-[10px] shrink-0`} aria-hidden="true">
                {item.ok ? "✓" : "!"}
              </span>
              {lang === "sw" ? item.label_sw : item.label_en}
            </p>
            {!item.ok && (
              <p className="mt-0.5 ml-7 text-xs text-flag-amber">
                {lang === "sw" ? item.warning_sw : item.warning_en}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
