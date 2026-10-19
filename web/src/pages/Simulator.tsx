import { useEffect, useState } from "react";
import { api, type Simulation } from "../api";
import { EmptyGate } from "../components/EmptyGate";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { money, streams as fmt } from "../lib/format";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function Simulator({ lang }: { lang: Lang }) {
  const { contract } = useKabla();
  const [n, setN] = useState(5_000_000);
  const [sim, setSim] = useState<Simulation | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!contract) return;
    api.simulate(contract.id, n).then(setSim).catch((e) => setErr(String(e)));
  }, [contract, n]);

  if (!contract) return <EmptyGate lang={lang} title={t(lang, "sim")} />;
  const max = Math.max(sim?.as_written.artist_keeps || 1, sim?.counter.artist_keeps || 1);

  return (
    <Room>
      <p className="sticker">{t(lang, "illustrate")}</p>
      <h1 className="font-display italic text-4xl mt-6">{t(lang, "sim")}</h1>
      <label className="block mt-8 text-sm">
        {fmt(n)} streams
        <input
          type="range"
          min={0}
          max={20_000_000}
          step={100_000}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full mt-3 accent-terracotta"
        />
      </label>
      {sim && (
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <Stage
            label={t(lang, "asWritten")}
            amount={sim.as_written.artist_keeps}
            max={max}
            tone="terracotta"
            detail={`royalty ${money(sim.as_written.royalty_earned)} · recoup ${money(sim.as_written.recoup_debt)}`}
          />
          <Stage
            label={t(lang, "after")}
            amount={sim.counter.artist_keeps}
            max={max}
            tone="savanna"
            detail={`royalty ${money(sim.counter.royalty_earned)} · recoup ${money(sim.counter.recoup_debt)}`}
          />
        </div>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      <NextStamp to="/theater">{t(lang, "nextTheater")}</NextStamp>
    </Room>
  );
}

function Stage({ label, amount, max, tone, detail }: {
  label: string; amount: number; max: number; tone: "terracotta" | "savanna"; detail: string;
}) {
  const bar = tone === "terracotta" ? "bg-terracotta" : "bg-savanna";
  return (
    <article className="panel p-5">
      <p className="text-[11px] uppercase tracking-widest opacity-60">{label}</p>
      <p className="font-display italic text-3xl mt-1">{money(amount)}</p>
      <div className="h-3 bg-ink/10 dark:bg-white/10 rounded-full mt-4 overflow-hidden">
        <div className={`h-3 ${bar} rounded-full`} style={{ width: `${(amount / max) * 100}%` }} />
      </div>
      <p className="mt-3 font-mono text-[11px] opacity-60">{detail}</p>
    </article>
  );
}
