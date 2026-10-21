import { t, type Lang } from "../i18n";
import { plainBadge } from "../plain";

/** Badge names come from the API ("Read Before Signing"); plain.ts gives the everyday name and a one-line meaning. */
export function BadgeShelf({ names, lang }: { names: string[]; lang: Lang }) {
  if (!names.length) return <p className="opacity-60 text-sm">{t(lang, "badgesNone")}</p>;
  return (
    <ul className="flex flex-wrap gap-3">
      {names.map((n) => {
        const b = plainBadge(lang, n);
        return (
          <li key={n} className="ticket border border-gold/70 bg-gold/10 px-4 py-2 text-sm" title={b.desc}>
            <span className="seal seal-gold mr-2 align-middle" aria-hidden="true">●</span>
            {b.name}
            {b.desc && <span className="block text-xs opacity-70 mt-0.5 ml-7">{b.desc}</span>}
          </li>
        );
      })}
    </ul>
  );
}
