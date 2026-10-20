import { useState } from "react";
import type { Readiness, ScoreSlice } from "../api";
import { t, type Lang } from "../i18n";

export function SignReadiness({ lang, data }: { lang: Lang; data: Readiness }) {
  const [open, setOpen] = useState<"as_written" | "after" | null>(null);
  return (
    <section className="panel p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-terracotta dark:text-gold">
        {t(lang, "signReady")}
      </p>
      <p className="text-xs opacity-70 mt-1">{t(lang, "whyTap")}</p>
      {data.projected && <p className="sticker mt-2">{t(lang, "projected")}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ScoreButton
          label={t(lang, "asWritten")}
          slice={data.as_written}
          pressed={open === "as_written"}
          onClick={() => setOpen(open === "as_written" ? null : "as_written")}
        />
        <ScoreButton
          label={data.after_kind === "best_case" || data.projected ? t(lang, "bestCase") : t(lang, "after")}
          slice={data.after}
          pressed={open === "after"}
          onClick={() => setOpen(open === "after" ? null : "after")}
        />
      </div>
      {open && (
        <ul className="mt-4 text-xs space-y-1 font-mono">
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

function ScoreButton({ label, slice, pressed, onClick }: {
  label: string; slice: ScoreSlice; pressed: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`panel text-left p-3 ${pressed ? "ring-2 ring-terracotta" : ""}`}
    >
      <p className="text-[11px] uppercase tracking-widest opacity-60">{label}</p>
      <p className="font-display italic text-4xl mt-1">{slice.score}</p>
    </button>
  );
}
