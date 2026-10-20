import { useEffect, useState } from "react";
import { api, type Readiness } from "../api";
import { ChecklistGate } from "../components/ChecklistGate";
import { EmptyGate } from "../components/EmptyGate";
import { HowTo } from "../components/HowTo";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { RoundCard } from "../components/RoundCard";
import { SignReadiness } from "../components/SignReadiness";
import { t, type Lang } from "../i18n";
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

  return (
    <Room wide>
      <header className="pb-3 border-b hair flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">{t(lang, "playbill")}</p>
          <h1 className="font-display italic text-3xl md:text-4xl mt-1 leading-none">{t(lang, "theater")}</h1>
        </div>
        <p className="font-mono text-xs opacity-70 self-end">
          {nego ? `${t(lang, "act")} ${nego.round}/${nego.max_rounds} · ${nego.state}` : "Kabla never agrees for you."}
        </p>
      </header>

      {!nego && (
        <button type="button" onClick={begin} disabled={busy} className="stamp stamp-savanna mt-6 self-start">
          {t(lang, "startRound")}
        </button>
      )}

      {nego && (
        <>
          {held && (
            <p className="sticker mt-4 bg-flag-red text-paper -rotate-1">{t(lang, "heldLine")}</p>
          )}
          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <p className="label">{t(lang, "artistDesk")}</p>
            <p className="label hidden md:flex">{t(lang, "labelDesk")}</p>
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
          {nego.state === "open" && (
            <button type="button" onClick={submit} disabled={busy} className="stamp stamp-terracotta mt-5 self-start">
              {t(lang, "sendDecisions")}
            </button>
          )}
          {nego.lawyer_note && (
            <p className="mt-4 text-sm border-l-2 border-flag-amber pl-3">{nego.lawyer_note}</p>
          )}
          <ol className="tele mt-5 max-h-32 overflow-auto border-t hair pt-2 space-y-0.5 opacity-70">
            {nego.ledger.map((m, i) => (
              <li key={i}>
                {String(m.round)} · {String(m.actor)} · {String(m.topic)} · {String(m.action)} · {String(m.value)}
              </li>
            ))}
          </ol>
          {nego.state !== "open" && <NextStamp to="/licence">{t(lang, "nextLicence")}</NextStamp>}
        </>
      )}
      {err && <p className="text-flag-red mt-4" role="alert">{err}</p>}
      {ready && (
        <div className="mt-5 pt-3 border-t hair space-y-3">
          <SignReadiness lang={lang} data={ready} />
          <ChecklistGate lang={lang} items={ready.checklist} />
        </div>
      )}
      <HowTo lang={lang} page="theater" />
    </Room>
  );
}
