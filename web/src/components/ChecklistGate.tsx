import type { ChecklistItem } from "../api";
import { t, type Lang } from "../i18n";
import { plainChecklist } from "../plain";

/** `bare`: the page already gave the list its heading, so skip the label and spacing above the note.
 *  The words come from plain.ts (by item key); an item we do not know keeps the API's own text. */
export function ChecklistGate({ lang, items, bare }: { lang: Lang; items: ChecklistItem[]; bare?: boolean }) {
  return (
    <section>
      {!bare && <p className="label">{t(lang, "checklist")}</p>}
      <p className={`text-xs opacity-70 ${bare ? "" : "mt-1.5"}`}>{t(lang, "checklistNote")}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item) => {
          const words = plainChecklist(lang, item);
          return (
            <li key={item.key} className="text-sm">
              <p className="flex items-center gap-2">
                <span className={`seal ${item.ok ? "seal-green" : "seal-amber"} !w-5 !h-5 !text-[10px] shrink-0`} aria-hidden="true">
                  {item.ok ? "✓" : "!"}
                </span>
                {words.label}
              </p>
              {!item.ok && (
                <p className="mt-0.5 ml-7 text-xs text-flag-amber">{words.warning}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
