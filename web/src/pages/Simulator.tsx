import { useEffect, useState } from "react";
import { api, type Simulation } from "../api";
import { EmptyGate } from "../components/EmptyGate";
import { HowTo } from "../components/HowTo";
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
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-3 border-b hair">
        <h1 className="font-display italic text-3xl md:text-4xl leading-none">{t(lang, "sim")}</h1>
        <p className="sticker">{t(lang, "illustrate")}</p>
      </div>
      <label className="block mt-5 max-w-2xl">
        <span className="label">{fmt(n)} streams</span>
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
        <div className="mt-6 grid md:grid-cols-2 gap-4 max-w-3xl">
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
      <HowTo lang={lang} page="sim" />
    </Room>
  );
}

function Stage({ label, amount, max, tone, detail }: {
  label: string; amount: number; max: number; tone: "terracotta" | "savanna"; detail: string;
}) {
  const bar = tone === "terracotta" ? "bg-terracotta" : "bg-savanna";
  return (
    <article className="panel p-4">
      <p className="label">{label}</p>
      <p className="font-display italic text-3xl mt-2 leading-none">{money(amount)}</p>
      <div className="h-2 bg-ink/10 dark:bg-white/10 mt-3 overflow-hidden">
        <div className={`h-2 ${bar}`} style={{ width: `${(amount / max) * 100}%` }} />
      </div>
      <p className="mt-2 font-mono text-[11px] opacity-60">{detail}</p>
    </article>
  );
}
