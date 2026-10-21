import { useEffect, useRef, useState } from "react";
import type { Readiness, ScoreSlice } from "../api";
import { t, tf, type Lang } from "../i18n";

/** One point on the per-round trail: the two scores as the API gave them after that round. */
export type TrailPoint = { round: number; written: number; after: number };

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

/** Two scores in one row. Why stays closed until a number is tapped.
 *  When a number changes it counts up or down and shows a +/- chip; the optional trail lists each round. */
export function SignReadiness({ lang, data, trail }: { lang: Lang; data: Readiness; trail?: TrailPoint[] }) {
  const [open, setOpen] = useState<"as_written" | "after" | null>(null);
  const afterLabel = data.after_kind === "best_case" || data.projected
    ? t(lang, "bestCase") : t(lang, "after");
  return (
    <section>
      <div className="flex flex-wrap items-end gap-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold self-center">
          {t(lang, "signReady")}
        </p>
        <ScoreButton
          lang={lang}
          label={t(lang, "asWritten")}
          slice={data.as_written}
          pressed={open === "as_written"}
          onClick={() => setOpen(open === "as_written" ? null : "as_written")}
        />
        <ScoreButton
          lang={lang}
          label={afterLabel}
          slice={data.after}
          pressed={open === "after"}
          onClick={() => setOpen(open === "after" ? null : "after")}
        />
        <p className="text-[11px] opacity-60 max-w-xs leading-snug">{t(lang, "whyTap")}</p>
      </div>
      {trail && trail.length > 1 && <ReadyTrail lang={lang} trail={trail} />}
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

function ScoreButton({ lang, label, slice, pressed, onClick }: {
  lang: Lang; label: string; slice: ScoreSlice; pressed: boolean; onClick: () => void;
}) {
  const shown = useCountUp(slice.score);
  const last = useRef(slice.score);
  const [delta, setDelta] = useState<{ n: number; id: number } | null>(null);
  useEffect(() => {
    const d = slice.score - last.current;
    last.current = slice.score;
    if (d === 0) return;
    setDelta({ n: d, id: Date.now() });
    const h = window.setTimeout(() => setDelta(null), 7000);
    return () => window.clearTimeout(h);
  }, [slice.score]);
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="text-left relative">
      <p className="text-[11px] uppercase tracking-widest opacity-60">{label}</p>
      <p className={`font-display italic text-3xl leading-none ${pressed ? "text-terracotta" : ""}`}>
        <span aria-label={String(slice.score)}>{shown}</span>
        {delta && (
          <span
            key={delta.id}
            className="delta-chip"
            data-dir={delta.n > 0 ? "up" : "down"}
            aria-label={tf(lang, delta.n > 0 ? "readyUp" : "readyDown", { n: Math.abs(delta.n) })}
          >
            {delta.n > 0 ? "+" : "−"}{Math.abs(delta.n)}
          </span>
        )}
      </p>
    </button>
  );
}

/** A small line of the "after" score, round by round, with the numbers written underneath. */
function ReadyTrail({ lang, trail }: { lang: Lang; trail: TrailPoint[] }) {
  const w = 120, h = 28;
  const vals = trail.map((p) => p.after);
  const lo = Math.min(...vals, ...trail.map((p) => p.written)), hi = Math.max(...vals, ...trail.map((p) => p.written));
  const y = (v: number) => (hi === lo ? h / 2 : h - 3 - ((v - lo) / (hi - lo)) * (h - 6));
  const x = (i: number) => 3 + (i * (w - 6)) / Math.max(1, trail.length - 1);
  const line = (key: "after" | "written") => trail.map((p, i) => `${x(i)},${y(p[key])}`).join(" ");
  return (
    <div className="ready-trail mt-2" role="group" aria-label={t(lang, "readyTrail")}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
        <polyline points={line("written")} className="trail-written" />
        <polyline points={line("after")} className="trail-after" />
        {trail.map((p, i) => <circle key={p.round} cx={x(i)} cy={y(p.after)} r="2.4" className="trail-dot" />)}
      </svg>
      <ol>
        {trail.map((p) => (
          <li key={p.round}>
            <span>{p.round === 0 ? t(lang, "readyStart") : tf(lang, "readyRound", { round: p.round })}</span>
            {" "}{p.written} → {p.after}
          </li>
        ))}
      </ol>
    </div>
  );
}
