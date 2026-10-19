import type { NegoTopic } from "../api";
import { t, type Lang } from "../i18n";

export function RoundCard({ topic, lang, onDecide, disabled }: {
  topic: NegoTopic; lang: Lang; disabled?: boolean;
  onDecide: (topic: string, decision: "approve" | "reject") => void;
}) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white/60 dark:bg-white/5 p-4">
      <header className="flex justify-between gap-2 text-sm">
        <h3 className="font-display text-lg capitalize">{topic.topic.replace("-", " ")}</h3>
        <span>{topic.is_redline ? "red line" : topic.severity} · clause {topic.clause}</span>
      </header>
      <p className="mt-2 text-sm">Ask: <strong>{String(topic.ask)}</strong> · offered: <strong>{String(topic.offered)}</strong> ({topic.kind})</p>
      <p className="mt-2 text-xs text-ink/70 dark:text-paper/70">{topic.policy_line}</p>
      <p className="mt-1 text-xs italic">Advice: {topic.advice}</p>
      {topic.status === "open" && (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={disabled} onClick={() => onDecide(topic.topic, "approve")}
            className="bg-savanna text-paper px-3 py-1.5 rounded-md text-sm disabled:opacity-50">{t(lang, "approve")}</button>
          <button type="button" disabled={disabled} onClick={() => onDecide(topic.topic, "reject")}
            className="bg-flag-red text-paper px-3 py-1.5 rounded-md text-sm disabled:opacity-50">{t(lang, "reject")}</button>
        </div>
      )}
      {topic.status !== "open" && <p className="mt-2 text-sm font-medium">{topic.status}</p>}
    </article>
  );
}
