import type { NegoTopic } from "../api";
import { t, tf, type Lang } from "../i18n";
import { tug, valueWord } from "../lib/tug";

/** Tug-of-war for one topic: the label pulls from the left, you pull from the right.
 *  Markers: a dot for what the contract says now, a token for the label's offer, a flag for your line.
 *  If the offer is on a red-line topic and has not reached your line, the bar turns red and shakes a little. */
export function TugBar({ topic, lang }: { topic: NegoTopic; lang: Lang }) {
  const g = tug(topic);
  const word = (v: string | number) => valueWord(lang, topic.topic, v);
  const aria = tf(lang, "tugAria", { offer: word(topic.offered), ask: word(topic.ask), now: word(topic.current) });
  const state = g.crosses ? "cross" : g.meets ? "met" : "short";
  const note = g.crosses ? t(lang, "tugCross") : g.meets ? t(lang, "tugMet") : t(lang, "tugShort");
  return (
    <div className="tug" data-state={state} data-redline={topic.is_redline ? "1" : undefined}>
      <div className="tug-track" role="img" aria-label={aria}>
        <span className="tug-end tug-end-l">{t(lang, "tugLabelEnd")}</span>
        <span className="tug-end tug-end-r">{t(lang, "tugYouEnd")}</span>
        <span className="tug-danger" style={{ width: `${g.line}%` }} aria-hidden="true" />
        <span className="tug-rope" style={{ left: `${Math.min(g.offer, g.line)}%`, width: `${Math.abs(g.line - g.offer)}%` }} aria-hidden="true" />
        <span className="tug-now" style={{ left: `${g.now}%` }} aria-hidden="true" />
        <span className="tug-line" style={{ left: `${g.line}%` }} aria-hidden="true" />
        <span className="tug-offer" style={{ left: `${g.offer}%` }} aria-hidden="true">L</span>
      </div>
      <p className="tug-note">{note}</p>
    </div>
  );
}
