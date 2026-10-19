import { t, type Lang } from "../i18n";

export function SyntheticBanner({ lang }: { lang: Lang }) {
  return (
    <p role="note" className="bg-terracotta text-paper text-sm tracking-wide text-center py-2 px-4">
      {t(lang, "synthetic")}
    </p>
  );
}
