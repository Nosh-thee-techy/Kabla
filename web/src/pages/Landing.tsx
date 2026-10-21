import { Link } from "react-router-dom";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";
import "../landing.css";

const STEPS = [
  { n: "01", group: "groupBefore", body: "lpBefore" },
  { n: "02", group: "groupDuring", body: "lpDuring" },
  { n: "03", group: "groupAfter", body: "lpAfter" },
] as const;

/** The front door. Plain words for a working musician: what Kabla is, the three steps, what it is not,
 *  and two ways in. The "sign in" behind the buttons is a local demo (see SignIn.tsx); nothing here
 *  claims an account system exists. */
export function Landing({ lang }: { lang: Lang }) {
  const { account } = useKabla();
  return (
    <main className="w-full flex-1 flex flex-col px-4 md:px-6 py-8 md:py-12 max-w-[1100px] mx-auto">
      <section className="max-w-3xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold">{t(lang, "lpEyebrow")}</p>
        <h1 className="lp-hero-title font-display italic mt-3">{t(lang, "lpTitle")}</h1>
        <p className="mt-5 text-base md:text-lg opacity-90 leading-relaxed">{t(lang, "lpLead")}</p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link to="/signin" className="stamp stamp-terracotta !px-7 !py-3 !text-sm">{t(lang, "lpStart")}</Link>
          <Link to="/signin?mode=signin" className="stamp stamp-ghost !px-7 !py-3 !text-sm">{t(lang, "lpSignIn")}</Link>
        </div>
        <p className="lp-demo mt-5 px-3 py-2 text-sm max-w-xl">{t(lang, "demoSignIn")}</p>
        {account && (
          <p className="mt-3 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{tf(lang, "lpWelcomeBack", { name: account.name })}</span>
            <Link to={account.onboarded ? "/passport" : "/welcome"} className="underline">{t(lang, "lpContinue")}</Link>
          </p>
        )}
      </section>

      <section className="mt-12 md:mt-16" aria-labelledby="lp-steps">
        <h2 id="lp-steps" className="label">{t(lang, "lpSteps")}</h2>
        <ol className="lp-steps mt-6">
          {STEPS.map((s) => (
            <li key={s.n} className="lp-step panel">
              <span className="lp-step-num" aria-hidden="true">{s.n}</span>
              <p className="lp-step-tag mt-3">{t(lang, s.group)}</p>
              <p className="mt-2 text-sm leading-relaxed">{t(lang, s.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 md:mt-16 panel p-5 md:p-6 max-w-3xl" aria-labelledby="lp-not">
        <h2 id="lp-not" className="label">{t(lang, "lpNotTitle")}</h2>
        <ul className="lp-not mt-3 text-sm md:text-base">
          {(["lpNot1", "lpNot2", "lpNot3"] as const).map((k) => (
            <li key={k}>
              <span className="seal seal-amber" aria-hidden="true">×</span>
              <span>{t(lang, k)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
