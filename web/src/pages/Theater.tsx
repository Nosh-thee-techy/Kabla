import { useState } from "react";
import { api } from "../api";
import { EmptyGate } from "../components/EmptyGate";
import { NextStamp } from "../components/NextStamp";
import { Room } from "../components/Room";
import { RoundCard } from "../components/RoundCard";
import { t, type Lang } from "../i18n";
import { useKabla } from "../state";

export function Theater({ lang }: { lang: Lang }) {
  const { contract, nego, setNego } = useKabla();
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

  if (!contract) return <EmptyGate lang={lang} title={t(lang, "theater")} />;

  const held = Object.values(pending).includes("reject")
    || (nego?.ledger || []).some((m) => String(m.action) === "reject" || String(m.decision) === "reject");

  return (
    <Room wide>
      <header className="border-y border-gold/30 py-4 flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{t(lang, "playbill")}</p>
          <h1 className="font-display italic text-4xl mt-1">{t(lang, "theater")}</h1>
        </div>
        {nego && (
          <p className="font-mono text-sm self-end">
            {t(lang, "act")} {nego.round}/{nego.max_rounds} · {nego.state}
          </p>
        )}
      </header>
      <p className="mt-4 text-sm opacity-80">Kabla never agrees for you. Stamp every concession.</p>

      {!nego && (
        <button type="button" onClick={begin} disabled={busy} className="stamp stamp-savanna mt-8">
          {t(lang, "startRound")}
        </button>
      )}

      {nego && (
        <>
          {held && (
            <p className="sticker mt-6 bg-flag-red text-paper -rotate-1">{t(lang, "heldLine")}</p>
          )}
          <div className="mt-6 grid md:grid-cols-2 gap-3 text-[11px] uppercase tracking-widest opacity-50">
            <p>{t(lang, "artistDesk")}</p>
            <p className="hidden md:block">{t(lang, "labelDesk")}</p>
          </div>
          <div className="mt-2 grid md:grid-cols-2 gap-4">
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
            <button type="button" onClick={submit} disabled={busy} className="stamp stamp-terracotta mt-8">
              {t(lang, "sendDecisions")}
            </button>
          )}
          {nego.lawyer_note && (
            <p className="mt-6 text-sm border-l-4 border-flag-amber pl-3">{nego.lawyer_note}</p>
          )}
          <ol className="tele mt-8 max-h-36 overflow-auto border-t border-current/10 pt-3 space-y-1 opacity-70">
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
    </Room>
  );
}
