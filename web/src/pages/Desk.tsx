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
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 pb-4 border-b hair">
        <div>
          <h1 className="font-display italic text-5xl md:text-6xl leading-[1]">Kabla</h1>
          <p className="mt-2 text-lg opacity-80">{t(lang, "tagline")}</p>
        </div>
        <p className="sticker">{t(lang, "whisper")}</p>
      </div>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-10 gap-y-8">
        <section>
          <p className="label">{t(lang, "pick")}</p>
          {samples.length === 0 && !err && (
            <p className="mt-4 text-sm opacity-60">{t(lang, "openingDrawers")}</p>
          )}
          <ul className="mt-6 grid sm:grid-cols-3 gap-4 overflow-visible">
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
                    <p className="font-mono text-[10px] uppercase tracking-widest opacity-70">{s.id}</p>
                    <h3 className="font-display italic text-xl mt-0.5">{s.label}</h3>
                    <p className="mt-1.5 text-sm opacity-80 leading-snug">{s.blurb}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-widest">
                      {t(lang, f.tag)} · {s.kind} · SYNTHETIC
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <p className="label">{t(lang, "paste")}</p>
          <textarea
            className="field mt-3 w-full min-h-44 p-3 text-sm"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label={t(lang, "paste")}
          />
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => run({ text })}
            className="stamp stamp-savanna mt-3"
          >
            {busy ? t(lang, "analysing") : t(lang, "analyse")}
          </button>
          {err && <p className="mt-3 text-flag-red text-sm" role="alert">{err}</p>}
        </section>
      </div>
      <HowTo lang={lang} page="desk" />
    </Room>
  );
}
