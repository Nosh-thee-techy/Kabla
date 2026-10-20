import { useState } from "react";
import type { Readiness, ScoreSlice } from "../api";
import { t, type Lang } from "../i18n";

/** Two scores in one row. Why stays closed until a number is tapped. */
export function SignReadiness({ lang, data }: { lang: Lang; data: Readiness }) {
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
          label={t(lang, "asWritten")}
          slice={data.as_written}
          pressed={open === "as_written"}
          onClick={() => setOpen(open === "as_written" ? null : "as_written")}
        />
        <ScoreButton
          label={afterLabel}
          slice={data.after}
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

function ScoreButton({ label, slice, pressed, onClick }: {
  label: string; slice: ScoreSlice; pressed: boolean; onClick: () => void;
}) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick} className="text-left">
      <p className="text-[11px] uppercase tracking-widest opacity-60">{label}</p>
      <p className={`font-display italic text-3xl leading-none ${pressed ? "text-terracotta" : ""}`}>
        {slice.score}
      </p>
    </button>
  );
}
