import { Link } from "react-router-dom";
import { t, type Lang } from "../i18n";

export function EmptyGate({ lang, title }: { lang: Lang; title: string }) {
  return (
    <main className="w-full flex-1 grid place-items-center px-6 py-14 text-center">
      <p className="seal seal-gold mx-auto" aria-hidden="true">K</p>
      <h1 className="font-display italic text-3xl mt-4">{title}</h1>
      <p className="mt-2 text-sm opacity-80">{t(lang, "emptyHint")}</p>
      <Link to="/" className="stamp stamp-terracotta mt-6">
        {t(lang, "openMawingu")}
      </Link>
    </main>
  );
}
