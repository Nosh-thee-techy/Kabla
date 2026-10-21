import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { api, type Readiness } from "../api";
import { CurtainDown } from "../components/CurtainDown";
import { EmptyGate } from "../components/EmptyGate";
import { Clerk } from "../components/HowTo";
import { Room } from "../components/Room";
import { RoundCard } from "../components/RoundCard";
import { ReadyCard, type TrailPoint } from "../components/SignReadiness";
import { Stage } from "../components/Stage";
import { t, tf, type Lang } from "../i18n";
import { saveStart } from "../lib/tug";
import { useKabla } from "../state";
import "../theater.css";

type Trail = { nego: string | null; points: TrailPoint[] };
const trailKey = (contractId: string) => `kabla:trail:${contractId}`;

/** The readiness trail survives a reload the same way the rest of the demo state does (sessionStorage, same
 *  lifetime). If storage is blocked it just starts again; nothing here is needed for the page to work. */
function loadTrail(contractId: string | undefined): Trail {
  if (!contractId) return { nego: null, points: [] };
  try {
    const raw = sessionStorage.getItem(trailKey(contractId));
    if (raw) return JSON.parse(raw) as Trail;
  } catch { /* ignore */ }
  return { nego: null, points: [] };
}

export function Theater({ lang }: { lang: Lang }) {
  const { contract, nego, setNego } = useKabla();
  const [ready, setReady] = useState<Readiness | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Record<string, "approve" | "reject">>({});
  const [err, setErr] = useState<string | null>(null);
  // The trail is only written here; the Sign check page reads it back from sessionStorage and draws it.
  const [, setTrail] = useState<Trail>(() => loadTrail(contract?.id));
  const listRef = useRef<HTMLDivElement>(null);
  const seen = useRef<Map<string, number>>(new Map());
  async function begin() {
    if (!contract) return;
    setBusy(true); setErr(null);
    try {
      const started = await api.negotiateStart(contract.id);
      saveStart(started);
      setNego(started);
    }
    catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  async function submit() {
    if (!nego) return;
    setBusy(true); setErr(null);
    try {
      const decisions = nego.topics.filter((topic) => topic.status === "open").map((topic) => ({
        topic: topic.topic, decision: pending[topic.topic] || "approve",
      }));
      setNego(await api.negotiateDecide(nego.id, decisions));
      setPending({});
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  // A reload mid-round: make sure the "before" copy of round 1 exists if this tab saw round 1.
  useEffect(() => { if (nego) saveStart(nego); }, [nego]);

  useEffect(() => {
    if (!contract) return;
    let live = true;
    const nid = nego?.id ?? null;
    const round = nego?.round ?? 0;
    api.readiness(contract.id).then((r) => {
      // The room may have moved on before a slow answer arrives. The number still belongs to the round it was
      // asked in, so the trail keeps it; only the headline numbers wait for the latest answer.
      if (live) setReady(r);
      setTrail((prev) => {
        // A different negotiation than the one on record starts a new trail (keeping the "Start" point).
        const fresh = nid !== null && prev.nego !== null && prev.nego !== nid;
        const kept = fresh ? prev.points.filter((p) => p.round === 0) : prev.points;
        const points = [...kept.filter((p) => p.round !== round), { round, written: r.as_written.score, after: r.after.score }]
          .sort((a, b) => a.round - b.round);
        const next = { nego: nid ?? prev.nego, points };
        try { sessionStorage.setItem(trailKey(contract.id), JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }).catch(() => { if (live) setReady(null); });
    return () => { live = false; };
  }, [contract, nego]);

  if (!contract) return <EmptyGate lang={lang} title={t(lang, "theater")} />;

  const held = Object.values(pending).includes("reject")
    || (nego?.ledger || []).some((m) => String(m.action) === "reject" || String(m.decision) === "reject");

  // Plain-language state of play, so the page can say where you are instead of leaking enum names.
  const openTopics = nego ? nego.topics.filter((topic) => topic.status === "open") : [];
  const decidedCount = openTopics.filter((topic) => pending[topic.topic]).length;
  const isOpen = nego?.state === "open";
  const spotlight = isOpen ? openTopics.find((topic) => !pending[topic.topic]) ?? null : null;
  const stateWord = nego
    ? nego.state === "agreed" ? t(lang, "stateAgreed")
      : nego.state === "standoff" ? t(lang, "stateStandoff")
        : nego.state === "walk-away" ? t(lang, "stateWalkAway") : nego.state
    : "";
  const say = !nego
    ? t(lang, "sayTheaterIdle")
    : isOpen
      ? tf(lang, "sayTheaterOpen", { round: nego.round, max: nego.max_rounds, n: openTopics.length })
      : tf(lang, "sayTheaterDone", { state: stateWord });
  // 0 raise · 1 decide · 2 stamp · 3 licence
  const station = !nego ? 0 : !isOpen ? 3 : decidedCount > 0 ? 2 : 1;
  const flow = ["flowRaise", "flowDecide", "flowStamp", "flowLicence"] as const;

  // One card at a time: the one being talked about first, then the ones waiting, then the answered pile (in the
  // order you answered). Answering moves a card down the list and the next one comes up.
  const waiting = openTopics.filter((topic) => !pending[topic.topic] && topic.topic !== spotlight?.topic);
  const answered = Object.keys(pending)
    .map((k) => openTopics.find((topic) => topic.topic === k))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const ordered = !nego ? [] : !isOpen ? nego.topics : [
    ...(spotlight ? [spotlight] : []),
    ...waiting,
    ...answered,
    ...nego.topics.filter((topic) => topic.status !== "open"),
  ];
  const orderKey = ordered.map((topic) => topic.topic).join("|");

  // Slide cards to their new place instead of jumping (skipped if the visitor prefers less motion).
  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    root.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      const key = el.dataset.flip as string;
      const top = el.offsetTop;
      next.set(key, top);
      const was = seen.current.get(key);
      if (!still && was !== undefined && was !== top && el.animate) {
        el.animate(
          [{ transform: `translateY(${was - top}px)` }, { transform: "translateY(0)" }],
          { duration: 520, easing: "cubic-bezier(0.22, 0.9, 0.3, 1)" },
        );
      }
    });
    seen.current = next;
  }, [orderKey]);

  return (
    <Room wide>
      <header className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "playbill")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none theater-title">{t(lang, "theater")}</h1>
        </div>
        <ol className="flow self-end" aria-label={t(lang, "journey")}>
          {flow.map((key, i) => (
            <li key={key} aria-current={i === station ? "step" : undefined} className={i < station ? "done" : ""}>
              <span>{i + 1}</span>{t(lang, key)}
            </li>
          ))}
        </ol>
      </header>

      <Clerk
        lang={lang}
        page="theater"
        cue={`theater:${!nego ? "idle" : isOpen ? `open:${nego.round}` : "done"}`}
        say={say}
        cta={
          !nego
            ? { label: t(lang, "ctaRaise"), onClick: () => void begin() }
            : isOpen
              ? { label: t(lang, "ctaDecide") }
              : { label: t(lang, "ctaLicence"), to: "/licence" }
        }
      />

      <div className="mt-5">
        <Stage
          lang={lang}
          nego={nego}
          spotlight={spotlight ?? openTopics[0] ?? null}
          stateWord={stateWord}
          busy={busy}
          onRaise={() => void begin()}
        />
      </div>

      {nego && (
        <>
          {held && (
            <p className="sticker mt-4 bg-flag-red text-paper -rotate-1">{t(lang, "heldLine")}</p>
          )}

          {!isOpen && <CurtainDown lang={lang} nego={nego} ready={ready} stateWord={stateWord} />}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="label flex-1 min-w-[12rem]">{t(lang, "counterOffers")}</p>
            <div className="rounds" role="group" aria-label={tf(lang, "roundOf", { round: nego.round, max: nego.max_rounds })}>
              <span className="rounds-text">{tf(lang, "roundOf", { round: nego.round, max: nego.max_rounds })}</span>
              <ol className="rounds-pips" aria-hidden="true">
                {Array.from({ length: nego.max_rounds }, (_, i) => (
                  <li key={i} data-state={i + 1 < nego.round || (!isOpen && i + 1 === nego.round) ? "done" : i + 1 === nego.round ? "now" : "todo"} />
                ))}
              </ol>
              {isOpen && (
                <span className="rounds-text">{tf(lang, "decided", { d: decidedCount, n: openTopics.length })}</span>
              )}
            </div>
          </div>
          <div className="deck mt-3" data-focus={spotlight ? "1" : undefined} ref={listRef}>
            {ordered.map((topic) => (
              <RoundCard
                key={topic.topic}
                topic={topic}
                lang={lang}
                disabled={busy}
                spotlight={spotlight?.topic === topic.topic}
                selected={pending[topic.topic]}
                onDecide={(name, d) => setPending((p) => ({ ...p, [name]: d }))}
                onUndo={(name) => setPending((p) => { const { [name]: _drop, ...rest } = p; return rest; })}
              />
            ))}
          </div>
          {isOpen && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={submit} disabled={busy} className="stamp stamp-terracotta">
                {t(lang, "sendDecisions")}
              </button>
              {decidedCount < openTopics.length && (
                <p className="text-xs opacity-70">{t(lang, "undecidedApprove")}</p>
              )}
            </div>
          )}
          {isOpen && <p className="mt-3 text-xs opacity-70">{t(lang, "neverAgrees")}</p>}
          <details className="mt-5 border-t hair pt-2">
            <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
              {t(lang, "ledgerLog")} · {nego.ledger.length}
            </summary>
            <ol className="tele mt-2 max-h-32 overflow-auto space-y-0.5 opacity-70">
              {nego.ledger.map((m, i) => (
                <li key={i}>
                  {String(m.round)} · {String(m.actor)} · {String(m.topic)} · {String(m.action)} · {String(m.value)}
                </li>
              ))}
            </ol>
          </details>
        </>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      {ready && <ReadyCard lang={lang} data={ready} />}
    </Room>
  );
}
