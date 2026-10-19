import { useState } from "react";
import { ClauseHighlight } from "../components/ClauseHighlight";
import { EmptyGate } from "../components/EmptyGate";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { TrailBody, TrailDrawer } from "../components/TrailDrawer";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function ClauseMap({ lang }: { lang: Lang }) {
  const { contract, analysis } = useKabla();
  const [n, setN] = useState<number | null>(null);
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

      <div className="mt-8 grid lg:grid-cols-[minmax(0,1fr)_28rem] gap-8 items-start">
        <ClauseHighlight text={contract.text} analysis={analysis} selected={n} onPick={setN} />
        <aside className="hidden lg:block sticky top-4 rounded-sm border border-current/10 bg-white/50 dark:bg-dusk-2/80 p-5 min-h-[60vh]">
          {flag ? (
            <TrailBody flag={flag} lang={lang} />
          ) : (
            <p className="font-display italic text-xl opacity-60">{t(lang, "pickSealed")}</p>
          )}
        </aside>
      </div>
      {flag && <TrailDrawer flag={flag} lang={lang} onClose={() => setN(null)} />}
      <NextStamp to="/simulate">{t(lang, "nextSim")}</NextStamp>
    </Room>
  );
}
