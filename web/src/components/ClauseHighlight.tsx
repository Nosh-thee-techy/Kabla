import type { Analysis } from "../api";

type Block = { n: number; title: string; body: string };

export function splitClauses(text: string): Block[] {
  const lines = text.split(/\r?\n/);
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const line of lines) {
    const m = line.match(/^(\d+)\.\s+(.*)$/);
    if (m) {
      if (current) blocks.push(current);
      current = { n: Number(m[1]), title: m[2], body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) blocks.push(current);
  return blocks;
}

export function ClauseHighlight({ text, analysis, onPick, selected }: {
  text: string; analysis: Analysis | null; selected?: number | null;
  onPick: (n: number) => void;
}) {
  const blocks = splitClauses(text);
  return (
    <div className="space-y-2 font-sans text-[16px] leading-7">
      {blocks.map((b) => {
        const sev = analysis?.clause_severity?.[String(b.n)];
        const dim = selected != null && selected !== b.n;
        const live = selected === b.n;
        const cls = sev === "red" ? "clause-red" : sev === "amber" ? "clause-amber" : "bg-white/40 dark:bg-white/5";
        return (
          <section key={b.n} className={dim ? "opacity-40 transition-opacity" : "transition-opacity"}>
            {sev ? (
              <button
                type="button"
                onClick={() => onPick(b.n)}
                className={`w-full text-left rounded-sm px-3 py-3 ${cls} ${live ? "ring-2 ring-terracotta" : ""}`}
              >
                <span className="flex items-start gap-3">
                  <span className={`seal ${sev === "red" ? "seal-red" : "seal-amber"} mt-0.5`} aria-hidden="true">
                    {sev === "red" ? "▲" : "■"}
                  </span>
                  <span>
                    <strong>{b.n}. {b.title}</strong>
                    <span className="sr-only"> {sev}</span>
                    <span className="block whitespace-pre-wrap mt-1">{b.body}</span>
                  </span>
                </span>
              </button>
            ) : (
              <div className="px-3 py-2 opacity-80">
                <strong>{b.n}. {b.title}</strong>
                <p className="whitespace-pre-wrap mt-1">{b.body}</p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
