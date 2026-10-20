import { useEffect, useState } from "react";
import { api, type Readiness } from "../api";
import { ChecklistGate } from "../components/ChecklistGate";
import { EmptyGate } from "../components/EmptyGate";
import { Clerk } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { RoundCard } from "../components/RoundCard";
import { SignReadiness } from "../components/SignReadiness";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";

export function Theater({ lang }: { lang: Lang }) {
  const { contract, nego, setNego } = useKabla();
  const [ready, setReady] = useState<Readiness | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Record<string, "approve" | "reject">>({});
  const [err, setErr] = useState<string | null>(null);

  async function begin() {
    if (!contract) return;
    setBusy(true); setErr(null);
    try { setNego(await api.negotiateStart(contract.id)); }
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

  useEffect(() => {
    if (!contract) return;
    api.readiness(contract.id).then(setReady).catch(() => setReady(null));
  }, [contract, nego]);

  if (!contract) return <EmptyGate lang={lang} title={t(lang, "theater")} />;

  const held = Object.values(pending).includes("reject")
    || (nego?.ledger || []).some((m) => String(m.action) === "reject" || String(m.decision) === "reject");

  // Plain-language state of play, so the page can say where you are instead of leaking enum names.
  const openTopics = nego ? nego.topics.filter((topic) => topic.status === "open") : [];
  const decidedCount = openTopics.filter((topic) => pending[topic.topic]).length;
  const isOpen = nego?.state === "open";
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

  return (
    <Room wide>
      <header className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "playbill")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "theater")}</h1>
        </div>
        <ol className="flow self-end" aria-label={t(lang, "journey")}>
          {flow.map((key, i) => (
            <li key={key} aria-current={i === station ? "step" : undefined} className={i < station ? "done" : ""}>
              <span>{i + 1}</span>{t(lang, key)}
            </li>
          ))}
        </ol>
      </header>

      <Clerk lang={lang} page="theater" say={say} />

      {!nego && (
        <button type="button" onClick={begin} disabled={busy} className="stamp stamp-savanna mt-5 self-start">
          {t(lang, "startRound")}
        </button>
      )}

      {nego && (
        <>
          {held && (
            <p className="sticker mt-4 bg-flag-red text-paper -rotate-1">{t(lang, "heldLine")}</p>
          )}
          <div className="mt-5 flex items-baseline justify-between gap-4">
            <p className="label flex-1">{t(lang, "counterOffers")} · {t(lang, "act")} {nego.round}/{nego.max_rounds}</p>
            {isOpen && (
              <p className="font-mono text-[11px] whitespace-nowrap">
                {tf(lang, "decided", { d: decidedCount, n: openTopics.length })}
              </p>
            )}
          </div>
          <div className="mt-3 grid md:grid-cols-2 gap-3">
            {nego.topics.map((topic) => (
              <RoundCard
                key={topic.topic}
                topic={topic}
                lang={lang}
                disabled={busy}
                selected={pending[topic.topic]}
                onDecide={(name, d) => setPending((p) => ({ ...p, [name]: d }))}
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
          {nego.lawyer_note && (
            <p className="mt-4 text-sm border-l-2 border-flag-amber pl-3">{nego.lawyer_note}</p>
          )}
          {!isOpen && <NextStamp to="/licence">{t(lang, "nextLicence")}</NextStamp>}
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
      {ready && (
        <div className="mt-5 pt-3 border-t hair space-y-3">
          <p className="label">{t(lang, "afterAct")}</p>
          <SignReadiness lang={lang} data={ready} />
          <ChecklistGate lang={lang} items={ready.checklist} />
        </div>
      )}
    </Room>
  );
}
