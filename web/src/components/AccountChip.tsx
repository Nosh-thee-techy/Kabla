import { useNavigate } from "react-router-dom";
import { t, tf, type Lang } from "../i18n";
import { useKabla } from "../state";

/** Header chip for the local demo sign-in: who is at the desk, and the one button that forgets everything in this tab. */
export function AccountChip({ lang }: { lang: Lang }) {
  const { account, signOut } = useKabla();
  const nav = useNavigate();
  if (!account) return null;
  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className="hidden sm:inline opacity-70 max-w-[9rem] truncate" title={account.name}>{tf(lang, "acctAs", { name: account.name })}</span>
      <button
        type="button"
        className="stamp stamp-ghost !px-2.5 !py-1.5 !text-[10px] sm:!text-[11px] whitespace-nowrap !tracking-[0.1em]"
        onClick={() => { signOut(); nav("/"); }}
      >
        {t(lang, "acctSignOut")}
      </button>
    </div>
  );
}
