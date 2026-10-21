import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Room } from "../components/Room";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";
import "../landing.css";

/** DEMO sign-in, not an account. Why it exists: the visitor needs a front door and a name on the desk, but a
 *  real login (passwords, email check, a user database) is out of scope for this entry. So: a display name and an
 *  optional contact, kept only in this browser tab (sessionStorage via state.tsx), never sent to the API, no password.
 *  The contact is not validated and not used for anything. */
export function SignIn({ lang }: { lang: Lang }) {
  const { account, setAccount, signOut } = useKabla();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const signingIn = params.get("mode") === "signin";
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    const n = name.trim();
    if (!n) { setErr(t(lang, "siNeedName")); return; }
    setAccount({ name: n, contact: contact.trim(), at: new Date().toISOString(), onboarded: false });
    nav("/welcome");
  }

  return (
    <Room>
      <div className="max-w-5xl w-full mx-auto grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-x-12 gap-y-8 items-start pt-4 md:pt-8">
        <section>
          <h1 className="font-display italic text-3xl md:text-4xl leading-tight">
            {account ? t(lang, "siTitleBack") : t(lang, "siTitle")}
          </h1>

          {account ? (
            <div className="mt-4">
              <p className="text-sm opacity-90">{tf(lang, "siBackLead", { name: account.name })}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="stamp stamp-terracotta"
                        onClick={() => nav(account.onboarded ? "/desk" : "/welcome")}>
                  {tf(lang, "siBackGo", { name: account.name })}
                </button>
                <button type="button" className="stamp stamp-ghost" onClick={() => { signOut(); nav("/"); }}>
                  {t(lang, "acctSignOut")}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-sm opacity-85 max-w-md">{t(lang, signingIn ? "siNoneHere" : "siLead")}</p>
              <form className="mt-5 space-y-4 max-w-md" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
                <label className="block">
                  <span className="label">{t(lang, "siName")}</span>
                  <input className="ph-dim mt-1 w-full border hair bg-transparent px-3 py-2" value={name} maxLength={60}
                         autoComplete="off" placeholder={t(lang, "siNamePh")} aria-required="true"
                         onChange={(e) => { setName(e.target.value); setErr(null); }} />
                </label>
                <label className="block">
                  <span className="label">{t(lang, "siContact")}</span>
                  <p className="text-xs opacity-60 mt-1">{t(lang, "siContactHint")}</p>
                  <input className="ph-dim mt-1 w-full border hair bg-transparent px-3 py-2" value={contact} maxLength={120}
                         autoComplete="off" placeholder={t(lang, "siContactPh")}
                         onChange={(e) => setContact(e.target.value)} />
                </label>
                {err && <p className="text-[#F0A39C] text-sm" role="alert">{err}</p>}
                <button type="submit" className="stamp stamp-terracotta">{t(lang, "siContinue")}</button>
              </form>
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="lp-demo px-4 py-3">
            <p className="text-sm font-semibold">{t(lang, "demoSignIn")}</p>
            <p className="text-xs opacity-80 mt-1.5 leading-relaxed">{t(lang, "siDemoMore")}</p>
          </div>
          <div className="panel px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{t(lang, "siReal")}</p>
            <p className="text-xs opacity-80 mt-1.5 leading-relaxed">{t(lang, "siRealMore")}</p>
          </div>
        </aside>
      </div>
    </Room>
  );
}
