import type { NegoTopic } from "../api";
import { t, tf, type Lang } from "../i18n";
import { adviceWord, topicName, tug, valueWord } from "../lib/tug";
import { TugBar } from "./TugBar";

/** One counter-offer as a contract card. The spotlight card is the one to look at next; cards you have not
 *  decided yet are dimmed; Approve / Reject stamps the card (the stamp is keyed so it plays again if you change your mind). */
export function RoundCard({ topic, lang, onDecide, disabled, selected, spotlight }: {
  topic: NegoTopic; lang: Lang; disabled?: boolean; spotlight?: boolean;
  selected?: "approve" | "reject";
  onDecide: (topic: string, decision: "approve" | "reject") => void;
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
    <article className="card" data-mood={mood} data-topic={topic.topic} data-cross={tug(topic).crosses ? "1" : undefined}>
      {spotlight && open && !selected && <p className="card-tag">{t(lang, "spotlightTag")}</p>}
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
      <p className="card-policy">{topic.policy_line}</p>
      <p className="card-advice"><span>{t(lang, "adviceLabel")}:</span> {adviceWord(lang, topic.advice)}</p>
      {open && (
        <div className="card-actions">
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
          {mood === "dim" || mood === "spot" ? <span className="card-undecided">{t(lang, "notDecided")}</span> : null}
        </div>
      )}
      {stamp && (
        <span key={stamp.key} className="ink-stamp" data-tone={stamp.tone} aria-hidden="true">{stamp.text}</span>
      )}
      {stamp && <span className="sr-only" role="status">{stamp.text}</span>}
    </article>
  );
}
