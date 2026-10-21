import type { Nego, NegoTopic } from "../api";
import { t, tf, type Lang } from "../i18n";
import { topicName, valueWord } from "../lib/tug";

/** The little stage: a curtain, two clerks (yours and the label's) and a speech card each.
 *  The curtain is closed before round 1, open while you decide, and closed again ("curtain down") at the end.
 *  Every word on the speech cards is built from the topic data the API already returned. */
export function Stage({ lang, nego, spotlight, stateWord, busy, onRaise }: {
  lang: Lang; nego: Nego | null; spotlight: NegoTopic | null; stateWord: string; busy: boolean; onRaise: () => void;
}) {
  const mode: "idle" | "play" | "end" = !nego ? "idle" : nego.state === "open" ? "play" : "end";
  const topic = spotlight;

  let you = t(lang, "stageIdleYou");
  let label = t(lang, "stageIdleLabel");
  if (mode === "end") {
    you = t(lang, "stageEndYou");
    label = t(lang, "stageEndLabel");
  } else if (topic) {
    const name = topicName(lang, topic.topic);
    you = tf(lang, topic.is_redline ? "stageYouLine" : "stageYouWant", { topic: name, ask: valueWord(lang, topic.topic, topic.ask) });
    label = tf(
      lang,
      topic.kind === "accept" ? "stageLabelAccept" : topic.kind === "reject" ? "stageLabelReject" : "stageLabelCounter",
      { offered: valueWord(lang, topic.topic, topic.offered) },
    );
  }
  const cross = mode === "play" && !!topic && topic.is_redline && String(topic.offered) !== String(topic.ask);

  return (
    <section className="stage" data-mode={mode} aria-label={t(lang, "stageAria")}>
      <div className="stage-room" aria-hidden={mode === "idle" ? true : undefined}>
        <div className="stage-lamp" aria-hidden="true" />
        <div className="stage-spot" aria-hidden="true" />
        <div className="stage-floor" aria-hidden="true" />
        <div className="stage-cast">
          <figure className="cast cast-you">
            <ClerkFigure kind="you" />
            <figcaption>{t(lang, "stageYou")}</figcaption>
          </figure>
          <p key={`y-${topic?.topic ?? mode}-${nego?.round ?? 0}`} className="speech speech-you">{you}</p>
          <p key={`l-${topic?.topic ?? mode}-${nego?.round ?? 0}`} className="speech speech-label" data-cross={cross ? "1" : undefined}>{label}</p>
          <figure className="cast cast-label">
            <ClerkFigure kind="label" />
            <figcaption>{t(lang, "stageLabel")}</figcaption>
          </figure>
        </div>
      </div>
      <div className="curtain curtain-l" aria-hidden="true" />
      <div className="curtain curtain-r" aria-hidden="true" />
      <div className="valance" aria-hidden="true" />
      {mode === "idle" && (
        <div className="stage-front">
          <button type="button" onClick={onRaise} disabled={busy} className="stamp stamp-savanna">
            {t(lang, "startRound")}
          </button>
        </div>
      )}
      {mode === "end" && (
        <div className="stage-front">
          <p className="stage-end">{t(lang, "curtainDown")} — {stateWord}</p>
        </div>
      )}
    </section>
  );
}

/** Two simple clerks. Yours wears the terracotta kofia (like Karani); the label's wears a dark hat and a red tie. */
function ClerkFigure({ kind }: { kind: "you" | "label" }) {
  const you = kind === "you";
  return (
    <svg viewBox="0 0 64 84" className="clerk-svg" aria-hidden="true">
      <ellipse cx="32" cy="80" rx="20" ry="3" fill="rgb(0 0 0 / 0.35)" />
      <path d="M12 80 Q12 52 32 52 Q52 52 52 80 Z" fill={you ? "#2F5D50" : "#3b4350"} stroke="#1B1A17" strokeWidth="1.5" />
      {you
        ? <path d="M26 52 L32 62 L38 52 Z" fill="#F6F1E7" stroke="#1B1A17" strokeWidth="1.2" />
        : <><path d="M26 52 L32 60 L38 52 Z" fill="#F6F1E7" stroke="#1B1A17" strokeWidth="1.2" /><path d="M30 58 L34 58 L35 72 L32 75 L29 72 Z" fill="#B3261E" stroke="#1B1A17" strokeWidth="1" /></>}
      <circle cx="32" cy="38" r="15" fill="#F6F1E7" stroke="#1B1A17" strokeWidth="1.5" />
      {you ? (
        <>
          <path d="M18 30 Q32 10 46 30 Z" fill="#C4572D" stroke="#1B1A17" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="16.5" y="28" width="31" height="4.5" fill="#D9A441" stroke="#1B1A17" strokeWidth="1.5" />
          <circle cx="26" cy="40" r="3.8" fill="none" stroke="#1B1A17" strokeWidth="1.4" />
          <circle cx="38" cy="40" r="3.8" fill="none" stroke="#1B1A17" strokeWidth="1.4" />
          <line x1="29.8" y1="40" x2="34.2" y2="40" stroke="#1B1A17" strokeWidth="1.4" />
          <path d="M27 47 Q32 51 37 47" fill="none" stroke="#1B1A17" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M19 28 Q32 14 45 28 Z" fill="#23262d" stroke="#1B1A17" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="15" y="27" width="34" height="3.5" rx="1.5" fill="#23262d" stroke="#1B1A17" strokeWidth="1.5" />
          <circle cx="26" cy="39" r="1.6" fill="#1B1A17" />
          <circle cx="38" cy="39" r="1.6" fill="#1B1A17" />
          <path d="M23 36 L29 37.5 M41 36 L35 37.5" stroke="#1B1A17" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M27 48 L37 48" stroke="#1B1A17" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
