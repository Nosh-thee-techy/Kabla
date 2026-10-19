import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
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
      const decisions = nego.topics.filter((t) => t.status === "open").map((t) => ({
        topic: t.topic, decision: pending[t.topic] || "approve",
      }));
      setNego(await api.negotiateDecide(nego.id, decisions));
      setPending({});
    } catch (e) { setErr(String(e)); }
    finally { setBusy(false); }
  }

  if (!contract) return <p className="p-8"><Link className="underline" to="/">Desk</Link> first.</p>;
  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="font-display text-4xl">{t(lang, "theater")}</h1>
      <p className="mt-2 text-sm">Kabla never agrees for you. Approve or reject every concession.</p>
      {!nego && (
        <button type="button" onClick={begin} disabled={busy} className="mt-6 bg-savanna text-paper px-4 py-2 rounded-lg">
          Start round 1
        </button>
      )}
      {nego && (
        <>
          <p className="mt-4 text-sm">Round {nego.round}/{nego.max_rounds} · {nego.state}</p>
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            {nego.topics.map((topic) => (
              <RoundCard key={topic.topic} topic={topic} lang={lang} disabled={busy}
                onDecide={(name, d) => setPending((p) => ({ ...p, [name]: d }))} />
            ))}
          </div>
          {nego.state === "open" && (
            <button type="button" onClick={submit} disabled={busy}
              className="mt-6 bg-terracotta text-paper px-4 py-2 rounded-lg">Send decisions</button>
          )}
          {nego.lawyer_note && <p className="mt-4 text-sm border-l-4 border-flag-amber pl-3">{nego.lawyer_note}</p>}
          <ol className="mt-8 text-xs space-y-1 max-h-40 overflow-auto border-t border-ink/10 pt-3">
            {nego.ledger.map((m, i) => (
              <li key={i}>{String(m.round)} · {String(m.actor)} · {String(m.topic)} · {String(m.action)} · {String(m.value)}</li>
            ))}
          </ol>
        </>
      )}
      {err && <p className="text-flag-red mt-4">{err}</p>}
    </main>
  );
}
