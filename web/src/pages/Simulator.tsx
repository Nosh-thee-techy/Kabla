import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Simulation } from "../api";
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

  if (!contract) return <p className="p-8"><Link className="underline" to="/">Desk</Link> first.</p>;
  const max = Math.max(sim?.as_written.artist_keeps || 1, sim?.counter.artist_keeps || 1);
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="font-display text-4xl">{t(lang, "sim")}</h1>
      <p className="mt-2 text-sm text-flag-amber">{t(lang, "illustrate")}</p>
      <label className="block mt-8 text-sm">Streams: {fmt(n)}
        <input type="range" min={0} max={20_000_000} step={100_000} value={n}
          onChange={(e) => setN(Number(e.target.value))} className="w-full mt-2" />
      </label>
      {sim && (
        <div className="mt-8 space-y-4">
          {([[t(lang, "asWritten"), sim.as_written.artist_keeps], [t(lang, "after"), sim.counter.artist_keeps]] as const).map(([label, v]) => (
            <div key={label}>
              <p className="text-sm mb-1">{label}: {money(v)}</p>
              <div className="h-8 bg-ink/10 rounded">
                <div className="h-8 bg-savanna rounded" style={{ width: `${(v / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {err && <p className="text-flag-red mt-4">{err}</p>}
    </main>
  );
}
