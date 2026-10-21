import { useState } from "react";
import { api } from "../api";
import { Clerk } from "../components/HowTo";
import { Room } from "../components/Room";
import { t, type Lang } from "../i18n";
import { plainVerifyReason } from "../plain";
import { useArtist, useKabla } from "../state";

export function Verify({ lang }: { lang: Lang }) {
  const { verify: result, setVerify, passport } = useKabla();
  // Why: the passport belongs to whoever's contract is open; "zawadi" is only the fallback for a cold start.
  const artist = useArtist();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function parse(): object | null {
    try { return JSON.parse(text); } catch { return null; }
  }

  async function run() {
    const cert = parse();
    if (!cert) { setErr(t(lang, "verifyNeedJson")); return; }
    setErr(null);
    try { setVerify(await api.verify({ certificate: cert })); }
    catch (e) { setErr(String(e)); }
  }

  async function tamper() {
    let cert = parse();
    if (!cert) {
      const existing = passport?.certificate || passport?.certificates?.[0];
      if (existing) {
        cert = existing;
        setText(JSON.stringify(existing, null, 2));
      } else {
        try {
          const p = await api.getPassport(artist);
          const c = p.certificate || p.certificates?.[0];
          if (!c) { setErr(t(lang, "verifyNeedPassport")); return; }
          cert = c;
          setText(JSON.stringify(c, null, 2));
        } catch (e) { setErr(String(e)); return; }
      }
    }
    setErr(null);
    try { setVerify(await api.tamperDemo(cert)); }
    catch (e) { setErr(String(e)); }
  }

  const ok = result?.intact;
  const lamp = result == null ? "lamp-idle" : ok ? "lamp-green" : "lamp-red";

  return (
    <Room>
      <div className="pb-3 border-b hair">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "customs")}</p>
        <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "verify")}</h1>
      </div>
      <Clerk lang={lang} page="verify" cue="verify" say={t(lang, "sayVerify")} cta={{ label: t(lang, "ctaTamper"), onClick: () => void tamper() }} />
      <div className="mt-5 grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <div>
          <p className="label">{t(lang, "tray")}</p>
          <textarea
            className="field mt-3 w-full min-h-[34vh] p-3 font-mono text-xs"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Certificate JSON"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={run} className="stamp stamp-savanna">{t(lang, "verify")}</button>
            <button type="button" onClick={tamper} className="stamp stamp-red">{t(lang, "tamper")}</button>
          </div>
          {err && <p className="text-flag-red text-sm mt-3" role="alert">{err}</p>}
        </div>
        <aside className="panel p-4 flex flex-col items-center text-center gap-3 sticky top-3">
          <div className={`lamp ${lamp}`} aria-hidden="true" />
          {result ? (
            <p className={`font-display italic text-4xl leading-none ${ok ? "text-savanna" : "text-flag-red"}`} role="status">
              {ok ? t(lang, "intact") : t(lang, "tampered")}
              <span className="block text-sm font-sans not-italic mt-2 opacity-80 text-ink dark:text-lamp">
                {ok ? t(lang, "mayPass") : t(lang, "brokenRecord")}{" "}
                {plainVerifyReason(lang, !!ok, result.reason)}
              </span>
              {result.reason && (
                <details className="mt-3 text-xs font-sans not-italic text-left text-ink dark:text-lamp">
                  <summary className="cursor-pointer underline opacity-80">{t(lang, "detailsReason")}</summary>
                  <p className="mt-2 font-mono text-[11px] opacity-80 break-words">{result.reason}</p>
                </details>
              )}
            </p>
          ) : (
            <p className="font-mono text-[11px] uppercase tracking-widest opacity-60">{t(lang, "customs")}</p>
          )}
        </aside>
      </div>
    </Room>
  );
}
