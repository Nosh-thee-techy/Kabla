import { Link } from "react-router-dom";
import type { Nego, Readiness } from "../api";
import { t, tf, type Lang } from "../i18n";
import { endLedger, loadStart, topicName, valueWord } from "../lib/tug";

/** The ending scene: who gave up what, a before/after card, and the way on to the licence desk.
 *  It only restates what is in the final negotiation and the round-1 snapshot. Kabla never agrees for you. */
export function CurtainDown({ lang, nego, ready, stateWord }: {
  lang: Lang; nego: Nego; ready: Readiness | null; stateWord: string;
}) {
  const start = loadStart(nego.id);
  const led = endLedger(nego, start);
  const w = (topic: string, v: string | number) => valueWord(lang, topic, v);
  const closing = nego.state === "agreed" ? t(lang, "endAgreed")
    : nego.state === "walk-away" ? t(lang, "endWalk") : t(lang, "endStandoff");
  return (
    <section className="ending" aria-labelledby="ending-title">
      <p className="ending-kicker">{t(lang, "curtainDown")} — {stateWord}</p>
      <h2 id="ending-title" className="ending-title">{t(lang, "endTitle")}</h2>
      <p className="ending-closing">{closing}</p>

      <div className="ending-grid">
        <div className="ending-col">
          <h3>{t(lang, "endLabelGave")}</h3>
          {led.labelGave.length === 0 ? <p className="ending-none">{t(lang, "endNothing")}</p> : (
            <ul>
              {led.labelGave.map((g) => (
                <li key={g.topic}>
                  {tf(lang, "endLabelLine", { topic: topicName(lang, g.topic), from: w(g.topic, g.from), to: w(g.topic, g.to) })}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ending-col">
          <h3>{t(lang, "endYouGave")}</h3>
          {led.youGave.length === 0 ? <p className="ending-none">{t(lang, "endNothing")}</p> : (
            <ul>
              {led.youGave.map((g) => (
                <li key={g.topic}>
                  {tf(lang, "endYouLine", { topic: topicName(lang, g.topic), want: w(g.topic, g.want), got: w(g.topic, g.got) })}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ending-col" data-tone="open">
          <h3>{t(lang, "endOpen")}</h3>
          {led.open.length === 0 ? <p className="ending-none">{t(lang, "endNothing")}</p> : (
            <ul>{led.open.map((o) => <li key={o.topic}>{topicName(lang, o.topic)}</li>)}</ul>
          )}
        </div>
      </div>

      <div className="ba-card">
        <h3>{t(lang, "endBeforeAfter")}</h3>
        <table>
          <thead>
            <tr>
              <td />
              <th scope="col">{t(lang, "endBefore")}</th>
              <th scope="col">{t(lang, "endAfter")}</th>
            </tr>
          </thead>
          <tbody>
            {led.rows.map((r) => (
              <tr key={r.topic} data-changed={r.changed ? "1" : undefined} data-settled={r.settled ? "1" : undefined}>
                <th scope="row">{topicName(lang, r.topic)}</th>
                <td>{r.before === null ? "—" : w(r.topic, r.before)}</td>
                <td>{w(r.topic, r.after)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ready && (
          <p className="ba-score">
            {t(lang, "signReady")}: <b>{ready.as_written.score}</b> → <b>{ready.after.score}</b>
          </p>
        )}
      </div>

      <p className="ending-never">{t(lang, "neverAgrees")}</p>
      {nego.lawyer_note && <p className="ending-note">{nego.lawyer_note}</p>}
      <p className="mt-4">
        <Link to="/licence" className="stamp stamp-terracotta">{t(lang, "ctaLicence")} →</Link>
      </p>
    </section>
  );
}
