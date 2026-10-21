import { NavLink, useLocation } from "react-router-dom";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

type S = ReturnType<typeof useKabla>;

/** Three stages of an artist's story: Before a contract, During it, After it. */
const STEPS = [
  { to: "/onboard", key: "onboard" as const, group: "groupBefore" as const, done: (s: S) => !!s.profile },
  { to: "/passport", key: "regStep" as const, group: "groupBefore" as const, done: (s: S) => !!s.passport },
  { to: "/passport/issued", key: "passport" as const, group: "groupBefore" as const, done: (s: S) => !!s.passport },
  { to: "/desk", key: "desk" as const, group: "groupDuring" as const, done: () => true },
  { to: "/map", key: "map" as const, group: "groupDuring" as const, done: (s: S) => !!s.analysis },
  { to: "/simulate", key: "sim" as const, group: "groupDuring" as const, done: (s: S) => !!s.contract },
  { to: "/theater", key: "theater" as const, group: "groupDuring" as const, done: (s: S) => !!s.nego },
  { to: "/check", key: "signCheck" as const, group: "groupDuring" as const, done: (s: S) => !!s.nego },
  { to: "/licence", key: "licence" as const, group: "groupAfter" as const, done: (s: S) => !!s.licence },
  { to: "/financier", key: "financier" as const, group: "groupAfter" as const, done: (s: S) => !!s.passport },
  { to: "/verify", key: "verify" as const, group: "groupAfter" as const, done: (s: S) => !!s.verify },
];

/** Numbered ledger line, grouped by stage: Before 01-03 (You, Register your work, Your work passport) · During 04-08 · After 09-11. */
export function JourneyRail({ lang }: { lang: Lang }) {
  const store = useKabla();
  const { pathname } = useLocation();
  return (
    <nav aria-label={t(lang, "journey")} className="overflow-x-auto relative">
      <ol className="flex items-center gap-4 md:gap-5 min-w-max text-xs">
        {STEPS.map((step, i) => {
          // A nested room (/passport/issued) must not also light up its parent (/passport): an exact step match wins.
          const exactStep = STEPS.some((s) => s.to === pathname);
          const here = pathname === step.to || (!exactStep && step.to !== "/" && pathname.startsWith(step.to));
          const done = step.done(store) && !here;
          const startsGroup = i === 0 || STEPS[i - 1].group !== step.group;
          return (
            <li key={step.to} className="flex items-baseline gap-4 md:gap-5">
              {startsGroup && (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gold border-l hair pl-3 first:border-l-0 first:pl-0">
                  {t(lang, step.group)}
                </span>
              )}
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
