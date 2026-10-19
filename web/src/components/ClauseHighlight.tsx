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
    <div className="space-y-3 font-sans text-[17px] leading-7">
      {blocks.map((b) => {
        const sev = analysis?.clause_severity?.[String(b.n)];
        const cls = sev === "red" ? "clause-red" : sev === "amber" ? "clause-amber" : "px-3 py-2";
        const icon = sev === "red" ? "▲" : sev === "amber" ? "■" : "";
        return (
          <section key={b.n}>
            {sev ? (
              <button type="button" onClick={() => onPick(b.n)}
                className={`w-full text-left rounded-md px-3 py-2 ${cls} ${selected === b.n ? "ring-2 ring-terracotta" : ""}`}>
                <strong>{icon} {b.n}. {b.title}</strong>
                <span className="sr-only">{sev}</span>
                <p className="whitespace-pre-wrap mt-1">{b.body}</p>
              </button>
            ) : (
              <div className="px-3 py-2">
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
