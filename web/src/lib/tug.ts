import type { Nego, NegoTopic } from "../api";
import { tf, tOpt, type Lang } from "../i18n";

/** Everything the Theater shows about "how far apart are we" is worked out here, from the numbers and words the
 *  API already returns for each topic (current / offered / ask / is_redline). Nothing is invented and no engine
 *  logic is repeated: this only decides where to draw a marker. */

type V = string | number;

export const START = 8;   // where the contract's current wording sits on the bar (the label's end)
export const LINE = 76;   // where the artist's ask / red line sits; to the right of it is "better than your ask"

const same = (a: V, b: V) => String(a) === String(b);
const num = (v: V): number | null =>
  typeof v === "number" ? v : /^\d+(\.\d+)?$/.test(v) ? Number(v) : null;

export type Tug = {
  now: number;      // marker: what the contract says now
  offer: number;    // marker: what the label offers
  line: number;     // marker: your ask / red line
  meets: boolean;   // the offer reaches (or beats) what you want
  crosses: boolean; // a red-line topic where the offer does not reach the line
};

export function tug(topic: NegoTopic): Tug {
  const { current, offered, ask } = topic;
  const c = num(current);
  const a = num(ask);
  const place = (v: V): number => {
    if (same(v, ask)) return LINE;
    if (same(v, current)) return START;
    const n = num(v);
    if (n !== null && c !== null && a !== null && a !== c) {
      const p = START + ((LINE - START) * (n - c)) / (a - c);
      return Math.max(2, Math.min(98, p));
    }
    // Words with no number to measure: we know it is somewhere between the two ends, nothing more.
    return (START + LINE) / 2;
  };
  const offer = place(offered);
  const meets = same(offered, ask) || offer >= LINE;
  return { now: place(current), offer, line: LINE, meets, crosses: topic.is_redline && !meets };
}

/** A plain-language name for a topic ("term" -> "Length of the deal"). Falls back to the raw word. */
export function topicName(lang: Lang, topic: string): string {
  return tOpt(lang, `topic_${topic.replace(/-/g, "_")}`) ?? topic.replace(/-/g, " ");
}

/** A plain-language value ("opt-in-paid" -> "only if you say yes, and you are paid"; 7 -> "7 years"). */
export function valueWord(lang: Lang, topic: string, v: V): string {
  const n = num(v);
  if (n !== null) {
    if (topic === "royalty") return tf(lang, "unitPct", { n });
    if (topic === "term" || topic === "reversion") return tf(lang, "unitYears", { n });
    return String(v);
  }
  return tOpt(lang, `val_${String(v).replace(/-/g, "_")}`) ?? String(v).replace(/-/g, " ");
}

export function adviceWord(lang: Lang, advice: string): string {
  return tOpt(lang, `adv_${advice.replace(/-/g, "_")}`) ?? advice.replace(/-/g, " ");
}

/** The contract as it stood before round 1. The API overwrites `current` when you approve a counter, so we keep
 *  one copy of round 1 in sessionStorage (same lifetime as the rest of the demo state) to draw "before". */
const snapKey = (id: string) => `kabla:nego-start:${id}`;

export function saveStart(nego: Nego) {
  if (nego.round !== 1) return;
  try {
    if (sessionStorage.getItem(snapKey(nego.id))) return;
    const snap: Record<string, V> = {};
    for (const t of nego.topics) snap[t.topic] = t.current;
    sessionStorage.setItem(snapKey(nego.id), JSON.stringify(snap));
  } catch { /* storage blocked: the Before column simply stays empty */ }
}

export function loadStart(id: string): Record<string, V> | null {
  try {
    const raw = sessionStorage.getItem(snapKey(id));
    return raw ? (JSON.parse(raw) as Record<string, V>) : null;
  } catch { return null; }
}

export type EndLedger = {
  labelGave: { topic: string; from: V; to: V }[];
  youGave: { topic: string; want: V; got: V }[];
  open: { topic: string; status: string }[];
  rows: { topic: string; before: V | null; after: V; changed: boolean; settled: boolean }[];
};

/** Who gave up what, worked out from the final topics and the round-1 snapshot. */
export function endLedger(nego: Nego, start: Record<string, V> | null): EndLedger {
  const out: EndLedger = { labelGave: [], youGave: [], open: [], rows: [] };
  for (const t of nego.topics) {
    const before = start && t.topic in start ? start[t.topic] : null;
    const settled = t.status === "agreed";
    const changed = before !== null && !same(before, t.current);
    if (changed) out.labelGave.push({ topic: t.topic, from: before as V, to: t.current });
    if (changed && !same(t.current, t.ask)) out.youGave.push({ topic: t.topic, want: t.ask, got: t.current });
    if (!settled) out.open.push({ topic: t.topic, status: t.status });
    out.rows.push({ topic: t.topic, before, after: t.current, changed, settled });
  }
  return out;
}
