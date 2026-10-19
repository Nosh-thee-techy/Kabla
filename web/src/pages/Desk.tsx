import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Sample } from "../api";
import { HowTo } from "../components/HowTo";
import { Room } from "../components/Room";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

function folder(id: string): { tone: string; tag: "folderTrap" | "folderMixed" | "folderFair" } {
  if (id === "c001") return { tone: "bg-[#f3d4c4] text-ink border-terracotta dark:bg-[#5a2c22] dark:text-lamp dark:border-terracotta", tag: "folderTrap" };
  if (id === "c002") return { tone: "bg-[#f3e4c0] text-ink border-flag-amber dark:bg-[#5a4818] dark:text-lamp dark:border-gold", tag: "folderMixed" };
  return { tone: "bg-[#d7e4db] text-ink border-savanna dark:bg-[#1f3d34] dark:text-lamp dark:border-savanna", tag: "folderFair" };
}

export function Desk({ lang }: { lang: Lang }) {
  const { setContract, setAnalysis } = useKabla();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => { api.samples().then((s) => setSamples(s.contracts)).catch((e) => setErr(String(e))); }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("sample");
    if (q === "c001" || q === "c002" || q === "c003") run({ sample_id: q });
    // demo deep-link for the video / verify
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(body: { sample_id?: string; text?: string }) {
    setBusy(true); setErr(null);
    try {
      const c = await api.createContract(body);
      const a = await api.analyze(c.id);
      setContract(c); setAnalysis(a);
      nav("/map");
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  return (
    <Room>
      <div className="max-w-3xl">
        <p className="sticker">{t(lang, "whisper")}</p>
        <h1 className="font-display italic text-5xl md:text-7xl mt-6 leading-[1.05]">Kabla</h1>
        <p className="mt-4 text-xl opacity-80">{t(lang, "tagline")}</p>
      </div>
      <HowTo lang={lang} page="desk" />

      <h2 className="mt-8 font-display text-2xl">{t(lang, "pick")}</h2>
      {samples.length === 0 && !err && (
        <p className="mt-6 text-sm opacity-60">{t(lang, "openingDrawers")}</p>
      )}
      <ul className="mt-8 grid md:grid-cols-3 gap-5 overflow-visible">
        {samples.map((s) => {
          const f = folder(s.id);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => run({ sample_id: s.id })}
                disabled={busy}
                className={`folder border ${f.tone} disabled:opacity-50`}
              >
                <span className="folder-tab" aria-hidden="true" />
                <p className="font-mono text-[11px] uppercase tracking-widest opacity-70">{s.id}</p>
                <h3 className="font-display italic text-2xl mt-1">{s.label}</h3>
                <p className="mt-2 text-sm opacity-80">{s.blurb}</p>
                <p className="mt-4 text-xs uppercase tracking-widest">
                  {t(lang, f.tag)} · {s.kind} · SYNTHETIC
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-14 font-display text-2xl">{t(lang, "paste")}</h2>
      <textarea
        className="field mt-3 w-full min-h-40 p-4"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={t(lang, "paste")}
      />
      <button
        type="button"
        disabled={busy || !text.trim()}
        onClick={() => run({ text })}
        className="stamp stamp-savanna mt-4"
      >
        {busy ? t(lang, "analysing") : t(lang, "analyse")}
      </button>
      {err && <p className="mt-3 text-flag-red" role="alert">{err}</p>}
    </Room>
  );
}
