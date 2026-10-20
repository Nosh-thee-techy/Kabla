import { useEffect, useState } from "react";
import { api, type Readiness } from "../api";
import { ClauseHighlight } from "../components/ClauseHighlight";
import { EmptyGate } from "../components/EmptyGate";
import { FairnessMeter } from "../components/FairnessMeter";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { SignReadiness } from "../components/SignReadiness";
import { TrailBody, TrailDrawer } from "../components/TrailDrawer";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";

export function ClauseMap({ lang }: { lang: Lang }) {
  const { contract, analysis } = useKabla();
  const [n, setN] = useState<number | null>(null);
  const [ready, setReady] = useState<Readiness | null>(null);
  useEffect(() => {
    if (!contract) return;
    api.readiness(contract.id).then(setReady).catch(() => setReady(null));
  }, [contract]);
  if (!contract || !analysis) return <EmptyGate lang={lang} title={t(lang, "map")} />;

  const flag = analysis.flags.find((f) => f.clause === n) || null;
  return (
    <Room wide>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-3 border-b hair">
        <div>
          <h1 className="font-display italic text-3xl md:text-4xl leading-none">{contract.title}</h1>
          <p className="font-mono text-[11px] mt-1.5 opacity-60">
            {contract.label} · {t(lang, "metta")} · {analysis.extraction_source}
          </p>
        </div>
        <p className="flex gap-2 text-sm">
          <span className="seal seal-red">{analysis.summary.red}</span>
          <span className="self-center">{t(lang, "red")}</span>
          <span className="seal seal-amber ml-2">{analysis.summary.amber}</span>
          <span className="self-center">{t(lang, "amber")}</span>
        </p>
      </div>
      <Clerk lang={lang} page="map" say={tf(lang, "sayMap", { red: analysis.summary.red, amber: analysis.summary.amber })} />
      {ready && (
        <div className="mt-3 space-y-2">
          <FairnessMeter lang={lang} data={ready.fairness} />
          <SignReadiness lang={lang} data={ready} />
        </div>
      )}

      <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_21rem] gap-5 items-start">
        <ClauseHighlight text={contract.text} analysis={analysis} selected={n} onPick={setN} />
        <aside className="panel hidden lg:block sticky top-3 p-4 min-h-[50vh]">
          <p className="label">{t(lang, "trail")}</p>
          <div className="mt-3">
            {flag ? (
              <TrailBody flag={flag} lang={lang} />
            ) : (
              <p className="font-display italic text-lg opacity-60">{t(lang, "pickSealed")}</p>
            )}
          </div>
        </aside>
      </div>
      {flag && <TrailDrawer flag={flag} lang={lang} onClose={() => setN(null)} />}
      <NextStamp to="/simulate">{t(lang, "nextSim")}</NextStamp>
    </Room>
  );
}
