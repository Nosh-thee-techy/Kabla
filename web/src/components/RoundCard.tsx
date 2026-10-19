import type { NegoTopic } from "../api";
import { t, type Lang } from "../i18n";

export function RoundCard({ topic, lang, onDecide, disabled, selected }: {
  topic: NegoTopic; lang: Lang; disabled?: boolean;
  selected?: "approve" | "reject";
  onDecide: (topic: string, decision: "approve" | "reject") => void;
}) {
  const open = topic.status === "open";
  return (
    <article className="panel p-4">
      <header className="flex justify-between gap-2 text-sm">
        <h3 className="font-display italic text-xl capitalize">{topic.topic.replace("-", " ")}</h3>
        <span className="font-mono text-[11px] opacity-70">
          {topic.is_redline ? "red line" : topic.severity} · cl. {topic.clause}
        </span>
      </header>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[11px] uppercase tracking-widest opacity-50">{t(lang, "askLabel")}</dt>
          <dd className="font-medium">{String(topic.ask)}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-widest opacity-50">{t(lang, "offeredLabel")}</dt>
          <dd className="font-medium">{String(topic.offered)} <span className="opacity-50">({topic.kind})</span></dd>
        </div>
      </dl>
      <p className="mt-3 text-xs opacity-70">{topic.policy_line}</p>
      <p className="mt-1 text-xs italic opacity-80">{t(lang, "adviceLabel")}: {topic.advice}</p>
      {open && (
        <div className="mt-4 flex gap-2">
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
      {!open && <p className="mt-3 text-sm font-medium text-gold">{topic.status}</p>}
    </article>
  );
}
