import { Link } from "react-router-dom";
import { t, type Lang } from "../i18n";

export function EmptyGate({ lang, title }: { lang: Lang; title: string }) {
  return (
    <main className="w-full flex-1 grid place-items-center px-6 py-20 text-center">
      <p className="seal seal-gold mx-auto" aria-hidden="true">K</p>
      <h1 className="font-display italic text-3xl mt-6">{title}</h1>
      <p className="mt-3 text-sm opacity-80">{t(lang, "emptyHint")}</p>
      <Link to="/" className="stamp stamp-terracotta mt-8">
        {t(lang, "openMawingu")}
      </Link>
    </main>
  );
}
