import { useState } from "react";
import { Link } from "react-router-dom";
import { ClauseHighlight } from "../components/ClauseHighlight";
import { TrailDrawer } from "../components/TrailDrawer";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function ClauseMap({ lang }: { lang: Lang }) {
  const { contract, analysis } = useKabla();
  const [n, setN] = useState<number | null>(null);
  if (!contract || !analysis) {
    return <p className="p-8">Open a contract from the <Link className="underline" to="/">Desk</Link>.</p>;
  }
  const flag = analysis.flags.find((f) => f.clause === n) || null;
  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <p className="text-sm">{analysis.summary.red} {t(lang, "red")} · {analysis.summary.amber} {t(lang, "amber")}</p>
      <h1 className="font-display text-4xl mt-2">{contract.title}</h1>
      <p className="text-sm mt-1">{contract.label} · MeTTa trail · {analysis.extraction_source}</p>
      <div className="mt-8">
        <ClauseHighlight text={contract.text} analysis={analysis} selected={n} onPick={setN} />
      </div>
      {flag && <TrailDrawer flag={flag} lang={lang} onClose={() => setN(null)} />}
    </main>
  );
}
