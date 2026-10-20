import { useEffect, useState } from "react";
import { api, type Readiness } from "../api";
import { ClauseHighlight } from "../components/ClauseHighlight";
import { EmptyGate } from "../components/EmptyGate";
import { FairnessMeter } from "../components/FairnessMeter";
import { HowTo } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { SignReadiness } from "../components/SignReadiness";
import { TrailBody, TrailDrawer } from "../components/TrailDrawer";
import { t, type Lang } from "../i18n";
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
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="flex gap-2 text-sm">
            <span className="seal seal-red">{analysis.summary.red}</span>
            <span className="self-center">{t(lang, "red")}</span>
            <span className="seal seal-amber ml-2">{analysis.summary.amber}</span>
            <span className="self-center">{t(lang, "amber")}</span>
          </p>
          <h1 className="font-display italic text-4xl mt-3">{contract.title}</h1>
          <p className="font-mono text-xs mt-2 opacity-60">
            {contract.label} · {t(lang, "metta")} · {analysis.extraction_source}
          </p>
        </div>
      </div>
      {ready && (
        <div className="mt-6 grid lg:grid-cols-2 gap-4">
          <FairnessMeter lang={lang} data={ready.fairness} />
          <SignReadiness lang={lang} data={ready} />
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_28rem] gap-8 items-start">
        <ClauseHighlight text={contract.text} analysis={analysis} selected={n} onPick={setN} />
        <aside className="panel hidden lg:block sticky top-4 p-5 min-h-[60vh]">
          {flag ? (
            <TrailBody flag={flag} lang={lang} />
          ) : (
            <p className="font-display italic text-xl opacity-60">{t(lang, "pickSealed")}</p>
          )}
        </aside>
      </div>
      {flag && <TrailDrawer flag={flag} lang={lang} onClose={() => setN(null)} />}
      <NextStamp to="/simulate">{t(lang, "nextSim")}</NextStamp>
      <HowTo lang={lang} page="map" />
    </Room>
  );
}
