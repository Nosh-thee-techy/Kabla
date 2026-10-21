import type { NegoTopic } from "../api";
import { t, tf, type Lang } from "../i18n";
import { adviceWord, topicName, tug, valueWord } from "../lib/tug";
import { plainPolicy } from "../plain";
import { TugBar } from "./TugBar";

/** One counter-offer as a contract card. Only one card is "in the light" at a time (the spotlight): it is big,
 *  sharp and has the Approve / Reject buttons. Cards still waiting are blurred. Once you answer, the card
 *  slides down to the answered pile, where it is small and slightly blurred, and the next one comes up.
 *  The stamp is keyed so it plays again if you change your mind. */
export function RoundCard({ topic, lang, onDecide, onUndo, disabled, selected, spotlight }: {
  topic: NegoTopic; lang: Lang; disabled?: boolean; spotlight?: boolean;
  selected?: "approve" | "reject";
  onDecide: (topic: string, decision: "approve" | "reject") => void;
  onUndo?: (topic: string) => void;
}) {
  const open = topic.status === "open";
  const word = (v: string | number) => valueWord(lang, topic.topic, v);
  const redline = topic.is_redline;
  const stamp = !open
    ? topic.status === "agreed"
      ? { key: "agreed", text: t(lang, "stampAgreed"), tone: "good" }
      : { key: "rejected", text: t(lang, "stampRejected"), tone: "bad" }
    : selected === "approve"
      ? { key: "approve", text: t(lang, "stampApproved"), tone: "good" }
      : selected === "reject"
        ? { key: "reject", text: t(lang, "stampRejected"), tone: "bad" }
        : null;
  const mood = !open || selected ? "decided" : spotlight ? "spot" : "dim";
  return (
    <article
      className="card"
      data-flip={topic.topic}
      data-mood={mood}
      data-topic={topic.topic}
      data-cross={tug(topic).crosses ? "1" : undefined}
      aria-current={mood === "spot" ? "true" : undefined}
    >
      {mood === "spot" && <p className="card-tag">{t(lang, "spotlightTag")}</p>}
      <header className="card-head">
        <h3>{topicName(lang, topic.topic)}</h3>
        <span className="card-meta">
          {tf(lang, "cardClause", { n: topic.clause })}
          {" · "}
          <span className={redline || topic.severity === "red" ? "text-flag-red-soft" : "text-amber-soft"}>
            {redline ? t(lang, "cardRedline") : topic.severity === "red" ? t(lang, "red") : t(lang, "amber")}
          </span>
        </span>
      </header>
      <dl className="card-vals">
        <div><dt>{t(lang, "cardNow")}</dt><dd>{word(topic.current)}</dd></div>
        <div className="card-offer"><dt>{t(lang, "cardOffer")}</dt><dd>{word(topic.offered)}</dd></div>
        <div><dt>{redline ? t(lang, "cardRedline") : t(lang, "cardWant")}</dt><dd>{word(topic.ask)}</dd></div>
      </dl>
      <TugBar topic={topic} lang={lang} />
      <p className="card-advice"><span>{t(lang, "adviceLabel")}:</span> {adviceWord(lang, topic.advice)}</p>
      {mood === "spot" && topic.policy_line && (
        <details className="card-why">
          <summary>{t(lang, "whyAdvice")}</summary>
          {plainPolicy(lang, topic.policy_line) ? (
            <>
              <p className="card-policy">{plainPolicy(lang, topic.policy_line)}</p>
              <details className="card-exact">
                <summary>{t(lang, "detailsFold")}</summary>
                <p className="card-policy">{topic.policy_line}</p>
              </details>
            </>
          ) : (
            <p className="card-policy">{topic.policy_line}</p>
          )}
        </details>
      )}
      {mood === "dim" && <p className="card-queue">{t(lang, "queueNote")}</p>}
      {open && mood === "decided" && onUndo && (
        <div className="card-actions">
          <button type="button" disabled={disabled} onClick={() => onUndo(topic.topic)} className="card-undo">
            {t(lang, "changeAnswer")}
          </button>
        </div>
      )}
      {open && mood === "spot" && (
        <div className="card-actions">
          <button
            type="button"
            disabled={disabled}
            aria-pressed={selected === "approve"}
            onClick={() => onDecide(topic.topic, "approve")}
            className="stamp stamp-savanna text-xs"
          >
            {t(lang, "approve")}
          </button>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={selected === "reject"}
            onClick={() => onDecide(topic.topic, "reject")}
            className="stamp stamp-red text-xs"
          >
            {t(lang, "reject")}
          </button>
        </div>
      )}
      {stamp && (
        <span key={stamp.key} className="ink-stamp" data-tone={stamp.tone} aria-hidden="true">{stamp.text}</span>
      )}
      {stamp && <span className="sr-only" role="status">{stamp.text}</span>}
    </article>
  );
}
