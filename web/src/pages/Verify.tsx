import { useState } from "react";
import { api } from "../api";
import { HowTo } from "../components/HowTo";
import { Room } from "../components/Room";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function Verify({ lang }: { lang: Lang }) {
  const { verify: result, setVerify, passport } = useKabla();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function parse(): object | null {
    try { return JSON.parse(text); } catch { return null; }
  }

  async function run() {
    const cert = parse();
    if (!cert) { setErr("Paste a certificate JSON first."); return; }
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
          const p = await api.getPassport("zawadi");
          const c = p.certificate || p.certificates?.[0];
          if (!c) { setErr("Issue a passport first, or paste JSON."); return; }
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
      <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{t(lang, "customs")}</p>
      <h1 className="font-display italic text-4xl mt-2">{t(lang, "verify")}</h1>
      <div className="mt-8 flex items-center gap-6">
        <div className={`lamp ${lamp}`} aria-hidden="true" />
        <p className="text-sm opacity-70">{t(lang, "tray")}</p>
      </div>
      <textarea
        className="field mt-6 w-full min-h-[40vh] p-3 font-mono text-xs"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Certificate JSON"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={run} className="stamp stamp-savanna">Verify</button>
        <button type="button" onClick={tamper} className="stamp stamp-red">{t(lang, "tamper")}</button>
      </div>
      {result && (
        <p className={`mt-10 font-display italic text-6xl ${ok ? "text-savanna" : "text-flag-red"}`} role="status">
          {ok ? t(lang, "intact") : t(lang, "tampered")}
          <span className="block text-lg font-sans not-italic mt-3 opacity-80">
            {ok ? t(lang, "mayPass") : t(lang, "brokenRecord")}
            {result.reason ? ` — ${result.reason}` : ""}
          </span>
        </p>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      <HowTo lang={lang} page="verify" />
    </Room>
  );
}
