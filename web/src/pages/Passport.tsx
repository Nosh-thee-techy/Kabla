import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type Readiness } from "../api";
import { ChecklistGate } from "../components/ChecklistGate";
import { Clerk } from "../components/HowTo";
import { Room } from "../components/Room";
import { t, type Lang } from "../i18n";
import { useArtist, useKabla } from "../state";

/** Page 1 of the passport job: get ready and register. Only the ready-check, what registering does,
 *  the consent line, the "also list for sale" tick and the button. The issued passport is on /passport/issued. */
export function Passport({ lang }: { lang: Lang }) {
  const { contract, passport: data, setPassport } = useKabla();
  const artist = useArtist();
  const navigate = useNavigate();
  const [ready, setReady] = useState<Readiness | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sell, setSell] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(!!contract);

  useEffect(() => {
    if (!contract) return;
    setChecking(true);
    api.readiness(contract.id).then(setReady).catch(() => setReady(null)).finally(() => setChecking(false));
  }, [contract]);

  async function go() {
    setErr(null);
    setBusy(true);
    try {
      await api.registerWork(sell);
      setPassport(await api.issuePassport(artist));
      navigate("/passport/issued");
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Room>
      <div className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "booklet")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "registerTitle")}</h1>
        </div>
        <p className="font-mono text-[11px] opacity-60">{t(lang, "passportEvidenceLine")}</p>
      </div>
      <Clerk
        lang={lang}
        page="passport"
        cue="passport"
        say={t(lang, "sayPassport")}
        cta={{ label: t(lang, "ctaChecklist") }}
      />
      <div className="mt-8 max-w-2xl w-full mx-auto space-y-8">
        {data && (
          <p className="text-sm border border-gold/40 bg-gold/10 px-4 py-3">
            {t(lang, "registerHavePassport")}{" "}
            <Link to="/passport/issued" className="underline whitespace-nowrap">{t(lang, "registerViewPassport")} →</Link>
          </p>
        )}

        <section>
          {ready
            ? <ChecklistGate lang={lang} items={ready.checklist} />
            : (
              <>
                <p className="label">{t(lang, "checklist")}</p>
                <p className="text-sm opacity-75 mt-3">
                  {t(lang, checking ? "registerChecking" : "registerNoCheck")}
                </p>
              </>
            )}
        </section>

        <section>
          <p className="label">{t(lang, "registerWhatTitle")}</p>
          <p className="text-sm leading-relaxed mt-3">{t(lang, "registerWhatBody")}</p>
        </section>

        <section>
          <p className="label">{t(lang, "registerConsentTitle")}</p>
          <p className="text-sm leading-relaxed mt-3">{t(lang, "registerConsentLine")}</p>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sell} onChange={(e) => setSell(e.target.checked)} />
            {t(lang, "sell")}
          </label>
          <button type="button" onClick={go} disabled={busy} className="stamp stamp-savanna mt-5">
            {t(lang, "register")} → {t(lang, "issue")}
          </button>
          {err && <p className="text-flag-red text-sm mt-3" role="alert">{err}</p>}
        </section>
      </div>
    </Room>
  );
}
