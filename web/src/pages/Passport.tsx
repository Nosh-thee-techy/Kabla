import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type WorkCheck } from "../api";
import { ChecklistGate } from "../components/ChecklistGate";
import { Clerk } from "../components/HowTo";
import { Room } from "../components/Room";
import { t, tf, tOpt, type Lang } from "../i18n";
import { rightName } from "../plain";
import { useArtist, useKabla } from "../state";

/** Before stage, step 2: register a work BEFORE any contract exists. It shows who owns the work and how it is split,
 *  that every co-writer said yes, and the AI rule, then registers with the artist's consent. All of it is read from the
 *  synthetic work "Asali ya Jioni" (GET /works/{id}/check); no contract is needed. The issued passport is on
 *  /passport/issued. Warnings never block: Kabla does not decide for the artist. */
export function Passport({ lang }: { lang: Lang }) {
  const { passport: data, setPassport } = useKabla();
  const artist = useArtist();
  const navigate = useNavigate();
  const [work, setWork] = useState<WorkCheck | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sell, setSell] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.workCheck(artist).then(setWork).catch((e) => setErr(String(e)));
  }, [artist]);

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

  const composition = work?.owners.filter((o) => o.right === "composition") ?? [];
  const ai = work?.ai_stance.value;
  const aiWords = ai ? (tOpt(lang, `val_${ai.replace(/-/g, "_")}`) ?? ai) : null;

  return (
    <Room>
      <div className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "groupBefore")} · {t(lang, "regBeforeTag")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "registerTitle")}</h1>
        </div>
        <p className="font-mono text-[11px] opacity-60">{t(lang, "passportEvidenceLine")}</p>
      </div>
      <Clerk
        lang={lang}
        page="register"
        cue="register"
        say={t(lang, "sayPassport")}
        cta={{ label: t(lang, "ctaChecklist") }}
      />
      <div className="mt-8 max-w-5xl w-full mx-auto space-y-8">
        {data && (
          <p className="text-sm border border-gold/40 bg-gold/10 px-4 py-3">
            {t(lang, "registerHavePassport")}{" "}
            <Link to="/passport/issued" className="underline whitespace-nowrap">{t(lang, "registerViewPassport")} →</Link>
          </p>
        )}
        <p className="text-sm opacity-80">{t(lang, "regDemoNote")}</p>

        <div className="grid lg:grid-cols-2 gap-x-10 gap-y-8 items-start">
          <div className="space-y-8">
            <section data-testid="work-card">
              <p className="label">{t(lang, "regWorkLabel")}</p>
              <h2 className="font-display italic text-3xl mt-2 leading-tight">{work ? work.title : "…"}</h2>
              <p className="sticker mt-3 inline-block">{t(lang, "synthetic").split("—")[0]}</p>
              {work && (
                <>
                  <p className="label mt-6">{t(lang, "regOwnersLabel")}</p>
                  <dl className="ledger mt-2">
                    {work.owners.map((o) => (
                      <div key={`${o.right}-${o.person}`}>
                        <dt>{o.name} · {rightName(lang, o.right)}</dt>
                        <dd>{o.share}%</dd>
                      </div>
                    ))}
                  </dl>
                  <p className={`text-sm mt-2 ${work.composition_total === 100 ? "" : "text-flag-amber"}`}>
                    {tf(lang, work.composition_total === 100 ? "regTotalOk" : "regTotalBad", { n: work.composition_total })}
                  </p>

                  <p className="label mt-6">{t(lang, "regConsentsLabel")}</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {composition.map((o) => (
                      <li key={o.person} className="flex items-center gap-2">
                        <span className={`seal ${o.confirmed ? "seal-green" : "seal-amber"} !w-5 !h-5 !text-[10px] shrink-0`} aria-hidden="true">
                          {o.confirmed ? "✓" : "!"}
                        </span>
                        {o.name} {t(lang, o.confirmed ? "regSaidYes" : "regNoYes")}
                      </li>
                    ))}
                  </ul>

                  <p className="label mt-6">{t(lang, "regAiRule")}</p>
                  <p className="text-sm mt-2">{aiWords ?? t(lang, "regAiNotSet")}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {t(lang, "regAiToolsLabel")}: {work.ai_tools.map((x) => (x === "none" ? t(lang, "regAiToolsNone") : x)).join(", ")}
                  </p>
                </>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section>
              {work
                ? <ChecklistGate lang={lang} items={work.checklist} />
                : (
                  <>
                    <p className="label">{t(lang, "checklist")}</p>
                    <p className="text-sm opacity-75 mt-3">{t(lang, "registerChecking")}</p>
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
                {t(lang, "regButton")}
              </button>
              {err && <p className="text-flag-red text-sm mt-3" role="alert">{err}</p>}
            </section>
          </div>
        </div>

        <aside className="guide-card p-4 text-sm max-w-2xl" aria-label={t(lang, "regNftTitle")} data-testid="nft-roadmap">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">{t(lang, "regNftTitle")}</p>
          <p className="mt-1.5 leading-snug">{t(lang, "regNftBody")}</p>
          <p className="mt-1.5 text-xs opacity-75 leading-snug">{t(lang, "regNftNow")}</p>
        </aside>
      </div>
    </Room>
  );
}
