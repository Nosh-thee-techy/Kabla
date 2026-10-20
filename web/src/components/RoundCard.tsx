import type { NegoTopic } from "../api";
import { t, type Lang } from "../i18n";

export function RoundCard({ topic, lang, onDecide, disabled, selected }: {
  topic: NegoTopic; lang: Lang; disabled?: boolean;
  selected?: "approve" | "reject";
  onDecide: (topic: string, decision: "approve" | "reject") => void;
}) {
  const open = topic.status === "open";
  return (
    <article className={`panel p-3 border-l-4 ${topic.is_redline || topic.severity === "red" ? "border-l-flag-red" : "border-l-flag-amber"}`}>
      <header className="flex justify-between items-baseline gap-2">
        <h3 className="font-display italic text-lg capitalize leading-none">{topic.topic.replace("-", " ")}</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
          {topic.is_redline ? "red line" : topic.severity} · cl. {topic.clause}
        </span>
      </header>
      <dl className="ledger mt-2">
        <div><dt>{t(lang, "askLabel")}</dt><dd>{String(topic.ask)}</dd></div>
        <div><dt>{t(lang, "offeredLabel")}</dt><dd>{String(topic.offered)} <span className="opacity-50">({topic.kind})</span></dd></div>
      </dl>
      <p className="mt-2 text-xs opacity-70 leading-snug">{topic.policy_line}</p>
      <p className="mt-0.5 text-xs italic opacity-80">{t(lang, "adviceLabel")}: {topic.advice}</p>
      {open && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={selected === "approve"}
            onClick={() => onDecide(topic.topic, "approve")}
            className={`stamp stamp-savanna text-xs ${selected === "approve" ? "ring-2 ring-lamp" : ""}`}
          >
            {t(lang, "approve")}
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={selected === "reject"}
            onClick={() => onDecide(topic.topic, "reject")}
            className={`stamp stamp-red text-xs ${selected === "reject" ? "ring-2 ring-lamp" : ""}`}
          >
            {t(lang, "reject")}
          </button>
        </div>
      )}
      {!open && <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-gold">{topic.status}</p>}
    </article>
  );
}
