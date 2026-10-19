import { useState } from "react";
import { api, type VerifyResult } from "../api";
import { t, type Lang } from "../i18n";

export function Verify({ lang }: { lang: Lang }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function parse(): object | null {
    try { return JSON.parse(text); } catch { return null; }
  }

  async function run() {
    const cert = parse();
    if (!cert) { setErr("Paste a certificate JSON first."); return; }
    setErr(null);
    try { setResult(await api.verify({ certificate: cert })); }
    catch (e) { setErr(String(e)); }
  }

  async function tamper() {
    let cert = parse();
    if (!cert) {
      const p = await api.getPassport("zawadi");
      const c = p.certificate || p.certificates?.[0];
      if (!c) { setErr("Issue a passport first, or paste JSON."); return; }
      cert = c;
      setText(JSON.stringify(c, null, 2));
    }
    setErr(null);
    try { setResult(await api.tamperDemo(cert)); }
    catch (e) { setErr(String(e)); }
  }

  const ok = result?.intact;
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-display text-4xl">{t(lang, "verify")}</h1>
      <textarea className="mt-6 w-full min-h-48 rounded-xl border border-ink/15 p-3 font-mono text-xs" value={text}
        onChange={(e) => setText(e.target.value)} aria-label="Certificate JSON" />
      <div className="mt-3 flex gap-3">
        <button type="button" onClick={run} className="bg-savanna text-paper px-4 py-2 rounded-lg">Verify</button>
        <button type="button" onClick={tamper} className="bg-flag-red text-paper px-4 py-2 rounded-lg">{t(lang, "tamper")}</button>
      </div>
      {result && (
        <p className={`mt-8 font-display text-5xl ${ok ? "text-savanna" : "text-flag-red"}`} role="status">
          {ok ? "● " + t(lang, "intact") : "▲ " + t(lang, "tampered")}
          <span className="block text-lg font-sans mt-2">{result.reason}</span>
        </p>
      )}
      {err && <p className="text-flag-red mt-4">{err}</p>}
    </main>
  );
}
