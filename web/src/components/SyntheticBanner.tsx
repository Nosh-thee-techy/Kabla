import { t, type Lang } from "../i18n";

export function SyntheticBanner({ lang }: { lang: Lang }) {
  return (
    <p role="note" className="bg-terracotta text-paper font-mono text-[10px] tracking-[0.18em] uppercase text-center py-1 px-4">
      {t(lang, "synthetic")}
    </p>
  );
}
