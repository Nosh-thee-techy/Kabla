import { NavLink, useLocation } from "react-router-dom";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

const STEPS = [
  { to: "/", key: "desk" as const, done: () => true },
  { to: "/map", key: "map" as const, done: (s: ReturnType<typeof useKabla>) => !!s.analysis },
  { to: "/simulate", key: "sim" as const, done: (s: ReturnType<typeof useKabla>) => !!s.contract },
  { to: "/theater", key: "theater" as const, done: (s: ReturnType<typeof useKabla>) => !!s.nego },
  { to: "/licence", key: "licence" as const, done: (s: ReturnType<typeof useKabla>) => !!s.licence },
  { to: "/passport", key: "passport" as const, done: (s: ReturnType<typeof useKabla>) => !!s.passport },
  { to: "/financier", key: "financier" as const, done: (s: ReturnType<typeof useKabla>) => !!s.passport },
  { to: "/verify", key: "verify" as const, done: (s: ReturnType<typeof useKabla>) => !!s.verify },
];

/** Numbered ledger line instead of pill chips: 01 Desk · 02 Clause map … */
export function JourneyRail({ lang }: { lang: Lang }) {
  const store = useKabla();
  const { pathname } = useLocation();
  return (
    <nav aria-label={t(lang, "journey")} className="overflow-x-auto">
      <ol className="flex items-center gap-4 md:gap-5 min-w-max text-xs">
        {STEPS.map((step, i) => {
          const here = pathname === step.to || (step.to !== "/" && pathname.startsWith(step.to));
          const done = step.done(store) && !here;
          return (
            <li key={step.to}>
              <NavLink
                to={step.to}
                end={step.to === "/"}
                className={`flex items-baseline gap-1.5 py-1 border-b-2 whitespace-nowrap ${
                  here
                    ? "border-terracotta dark:border-gold font-semibold"
                    : done
                      ? "border-transparent text-gold"
                      : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <span className="font-mono text-[10px] opacity-70">{String(i + 1).padStart(2, "0")}</span>
                {t(lang, step.key)}
                {here && <span className="sr-only"> — {t(lang, "youAreHere")}</span>}
                {done && <span className="sr-only"> — {t(lang, "sealed")}</span>}
              </NavLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
