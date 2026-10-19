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
  { to: "/verify", key: "verify" as const, done: (s: ReturnType<typeof useKabla>) => !!s.verify },
];

export function JourneyRail({ lang }: { lang: Lang }) {
  const store = useKabla();
  const { pathname } = useLocation();
  return (
    <nav aria-label={t(lang, "journey")} className="overflow-x-auto">
      <ol className="flex items-center gap-1 min-w-max text-xs">
        {STEPS.map((step, i) => {
          const here = pathname === step.to || (step.to !== "/" && pathname.startsWith(step.to));
          const done = step.done(store) && !here;
          return (
            <li key={step.to} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="w-4 h-px bg-current opacity-25 mx-0.5" />}
              <NavLink
                to={step.to}
                end={step.to === "/"}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap ${
                  here
                    ? "bg-terracotta text-paper"
                    : done
                      ? "text-foil"
                      : "opacity-70 hover:opacity-100"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`w-2 h-2 rounded-full ${here ? "bg-paper" : done ? "bg-gold" : "bg-current opacity-40"}`}
                />
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
