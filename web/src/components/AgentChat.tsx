import { useEffect, useRef, useState } from "react";
import { api, type OmegaStatus } from "../api";
import { t, type Lang } from "../i18n";

type Reply = { ts: number; text: string };

/** Chat with the Omega agent. Why it never freezes: sending returns at once (the message is a file the agent
 *  picks up) and replies are polled every 3 s, so a slow, sleeping or dead agent only ever shows as "waiting"
 *  or "offline". Everything it answers comes from the same synthetic-data, MeTTa-backed API as the rooms. */
export function AgentChat({ lang }: { lang: Lang }) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState<{ ts: number; text: string }[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [status, setStatus] = useState<OmegaStatus | null>(null);
  const [waiting, setWaiting] = useState(false);
  const [err, setErr] = useState("");
  const lastCount = useRef(0);

  useEffect(() => {
    let live = true;
    const poll = async () => {
      try {
        const r = await api.omegaRead();
        if (!live) return;
        setStatus(r);
        setReplies(r.replies);
        if (r.replies.length > lastCount.current) setWaiting(false);
        lastCount.current = r.replies.length;
      } catch {
        if (live) setStatus(null); // API unreachable: show nothing rather than a stale "online"
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

  async function send() {
    const msg = text.trim();
    if (!msg) return;
    setErr("");
    try {
      await api.omegaSend(msg);
      setSent((s) => [...s, { ts: Date.now() / 1000, text: msg }]);
      setText("");
      setWaiting(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  const thread = [
    ...sent.map((m) => ({ ...m, who: "you" as const })),
    ...replies.map((m) => ({ ...m, who: "agent" as const })),
  ].sort((a, b) => a.ts - b.ts);

  return (
    <section aria-labelledby="agent-h" className="mt-10 border-t hair pt-6">
      <h2 id="agent-h" className="font-display italic text-2xl">{t(lang, "agentTitle")}</h2>
      <p className="mt-1 text-sm opacity-70">{t(lang, "agentHint")}</p>
      {status && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest" role="status">
          {status.agent === "up" ? t(lang, "agentUp") : t(lang, "agentDown")} ·{" "}
          {status.llm === "live" ? t(lang, "agentLive") : t(lang, "agentOffline")}
        </p>
      )}
      <ol className="mt-4 space-y-2 max-h-72 overflow-y-auto" aria-live="polite">
        {thread.map((m, i) => (
          <li key={i} className={`text-sm ${m.who === "you" ? "text-right" : ""}`}>
            <span className="font-mono text-[10px] uppercase opacity-60 mr-2">{m.who === "you" ? "you" : "omega"}</span>
            {m.text}
          </li>
        ))}
        {waiting && <li className="text-sm opacity-60">{t(lang, "agentWaiting")}</li>}
      </ol>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          className="field flex-1 px-3 py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={t(lang, "agentTitle")}
          maxLength={1000}
        />
        <button type="submit" className="stamp stamp-savanna" disabled={!text.trim()}>
          {t(lang, "agentSend")}
        </button>
      </form>
      {err && <p className="mt-2 text-flag-red text-sm" role="alert">{err}</p>}
    </section>
  );
}
