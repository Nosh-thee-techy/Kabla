import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Readiness } from "../api";
import { t, tf, type Lang } from "../i18n";
import "../signcheck.css";

/** One point on the per-round trail: the two scores as the API gave them after that round. */
export type TrailPoint = { round: number; written: number; after: number };

export type Pick = "as_written" | "after";

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Counts from the old number to the new one. With reduced motion it just jumps. */
function useCountUp(value: number): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced() || from.current === value) { from.current = value; setShown(value); return; }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 700);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value]);
  return shown;
}

/** Two scores in one row (used on the clause map). Why stays closed until a number is tapped.
 *  The Theater and the Sign check page use the pieces below instead. */
export function SignReadiness({ lang, data }: { lang: Lang; data: Readiness }) {
  const [open, setOpen] = useState<Pick | null>(null);
  return (
    <section>
      <div className="flex flex-wrap items-end gap-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold self-center">
          {t(lang, "signReady")}
        </p>
        <ScoreButton
          label={t(lang, "asWritten")}
          score={data.as_written.score}
          pressed={open === "as_written"}
          onClick={() => setOpen(open === "as_written" ? null : "as_written")}
        />
        <ScoreButton
          label={afterName(lang, data)}
          score={data.after.score}
          pressed={open === "after"}
          onClick={() => setOpen(open === "after" ? null : "after")}
        />
        <p className="text-[11px] opacity-60 max-w-xs leading-snug">{t(lang, "whyTap")}</p>
      </div>
      {data.projected && (
        <p className="text-[11px] opacity-60 mt-1">{t(lang, "projected")}</p>
      )}
      {open && (
        <ul className="mt-2 text-xs space-y-1 font-mono">
          {(open === "as_written" ? data.as_written : data.after).reasons.map((r) => (
            <li key={r.event_id}>
              {r.already_true && <span className="opacity-60">{t(lang, "alreadyTrue")} · </span>}
              {r.points > 0 ? "+" : ""}{r.points} · {r.type} · {r.why}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ScoreButton({ label, score, pressed, onClick }: {
  label: string; score: number; pressed: boolean; onClick: () => void;
}) {
  const shown = useCountUp(score);
  const last = useRef(score);
  const [delta, setDelta] = useState<{ n: number; id: number } | null>(null);
  useEffect(() => {
    const d = score - last.current;
    last.current = score;
    if (d === 0) return;
    setDelta({ n: d, id: Date.now() });
    const h = window.setTimeout(() => setDelta(null), 7000);
    return () => window.clearTimeout(h);
  }, [score]);
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="text-left relative">
      <p className="text-[11px] uppercase tracking-widest opacity-60">{label}</p>
      <p className={`font-display italic text-3xl leading-none ${pressed ? "text-terracotta" : ""}`}>
        <span aria-label={String(score)}>{shown}</span>
        {delta && (
          <span key={delta.id} className="delta-chip" data-dir={delta.n > 0 ? "up" : "down"}>
            {delta.n > 0 ? "+" : "−"}{Math.abs(delta.n)}
          </span>
        )}
      </p>
    </button>
  );
}

/** The name of the second number: "Best case" until a negotiation exists, then "After negotiation". */
export function afterName(lang: Lang, data: Readiness): string {
  return data.after_kind === "best_case" || data.projected ? t(lang, "bestCase") : t(lang, "after");
}

/** Compact card for the Theater: the two numbers small, and the way to the full Sign check page. */
export function ReadyCard({ lang, data }: { lang: Lang; data: Readiness }) {
  const diff = data.after.score - data.as_written.score;
  return (
    <section className="ready-card" aria-label={t(lang, "signReady")}>
      <p className="ready-card-kicker">{t(lang, "signReady")}</p>
      <div className="ready-card-nums">
        <p><span>{t(lang, "asWritten")}</span><b>{data.as_written.score}</b></p>
        <p aria-hidden="true" className="ready-card-arrow">→</p>
        <p><span>{afterName(lang, data)}</span><b>{data.after.score}</b></p>
        {diff !== 0 && <p className="ck-chip" data-dir={diff > 0 ? "up" : "down"}>{diff > 0 ? "+" : "−"}{Math.abs(diff)}</p>}
      </div>
      <Link to="/check" className="stamp stamp-terracotta ready-card-go">{t(lang, "ctaCheck")} →</Link>
    </section>
  );
}

/** Headline of the Sign check page: two big numbers. Each is a button: tapping one picks which number's
 *  reasons are listed below (the same "tap a number for why", now as a clear switch). */
export function SignHeadline({ lang, data, pick, onPick }: {
  lang: Lang; data: Readiness; pick: Pick; onPick: (p: Pick) => void;
}) {
  const diff = data.after.score - data.as_written.score;
  const sentence = data.projected
    ? t(lang, "ckHeadProjected")
    : diff === 0
      ? t(lang, "ckHeadSame")
      : tf(lang, diff > 0 ? "ckHeadUp" : "ckHeadDown", { n: Math.abs(diff), a: data.as_written.score, b: data.after.score });
  return (
    <section className="ck-head" aria-labelledby="ck-head-title">
      <h2 id="ck-head-title" className="label">{t(lang, "signReady")}</h2>
      <div className="ck-nums">
        <BigNumber lang={lang} label={t(lang, "asWritten")} score={data.as_written.score} pressed={pick === "as_written"} onClick={() => onPick("as_written")} />
        <div className="ck-diff" aria-hidden="true">
          <span>→</span>
          {diff !== 0 && <b data-dir={diff > 0 ? "up" : "down"}>{diff > 0 ? "+" : "−"}{Math.abs(diff)}</b>}
        </div>
        <BigNumber lang={lang} label={afterName(lang, data)} score={data.after.score} pressed={pick === "after"} onClick={() => onPick("after")} />
      </div>
      <p className="ck-sentence">{sentence}</p>
    </section>
  );
}

function BigNumber({ lang, label, score, pressed, onClick }: {
  lang: Lang; label: string; score: number; pressed: boolean; onClick: () => void;
}) {
  const shown = useCountUp(score);
  return (
    <button type="button" className="ck-big" aria-pressed={pressed} onClick={onClick}>
      <span className="ck-big-label">{label}</span>
      <span className="ck-big-num" aria-label={String(score)}>{shown}</span>
      <span className="ck-big-of">{t(lang, "ckOutOf")}</span>
    </button>
  );
}

/** Round-by-round chart: both numbers on a 0 to 100 scale, with every round labelled underneath. */
export function TrailChart({ lang, trail }: { lang: Lang; trail: TrailPoint[] }) {
  const W = 360, H = 170, L = 30, R = 14, T = 20, B = 30;
  const all = trail.flatMap((p) => [p.written, p.after]);
  const lo = Math.min(0, ...all), hi = Math.max(100, ...all);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const x = (i: number) => trail.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (trail.length - 1);
  const line = (key: "after" | "written") => trail.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  const grid = [lo, Math.round((lo + hi) / 2), hi];
  return (
    <figure className="ck-trail">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(lang, "readyTrail")}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} className="ck-grid" />
            <text x={L - 6} y={y(g) + 3} textAnchor="end" className="ck-axis">{g}</text>
          </g>
        ))}
        {trail.length > 1 && <polyline points={line("written")} className="ck-line-written" />}
        {trail.length > 1 && <polyline points={line("after")} className="ck-line-after" />}
        {trail.map((p, i) => (
          <g key={p.round}>
            <circle cx={x(i)} cy={y(p.written)} r="3.2" className="ck-dot-written" />
            <circle cx={x(i)} cy={y(p.after)} r="4" className="ck-dot-after" />
            <text x={x(i)} y={y(Math.max(p.after, p.written)) - 8} textAnchor="middle" className="ck-val">{p.after}</text>
            <text x={x(i)} y={H - 10} textAnchor="middle" className="ck-round">
              {p.round === 0 ? t(lang, "readyStart") : tf(lang, "readyRound", { round: p.round })}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="ck-legend">
        <span><i className="ck-key-after" />{t(lang, "ckLineAfter")}</span>
        <span><i className="ck-key-written" />{t(lang, "ckLineWritten")}</span>
      </figcaption>
    </figure>
  );
}