import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { JourneyRail } from "./components/JourneyRail";
import { LangToggle } from "./components/LangToggle";
import { SyntheticBanner } from "./components/SyntheticBanner";
import { Wordmark } from "./components/Wordmark";
import { t, type Lang } from "./i18n";
import { ClauseMap } from "./pages/ClauseMap";
import { Desk } from "./pages/Desk";
import { LicenceDesk } from "./pages/LicenceDesk";
import { Passport } from "./pages/Passport";
import { Simulator } from "./pages/Simulator";
import { Theater } from "./pages/Theater";
import { Verify } from "./pages/Verify";
import { KablaProvider } from "./state";

const DUSK = new Set(["/theater", "/passport", "/verify"]);

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("kabla-lamp") === "on"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("kabla-lamp", dark ? "on" : "off"); }
    catch { /* ignore */ }
  }, [dark]);
  const { pathname } = useLocation();
  const dusk = DUSK.has(pathname);
  const night = dusk || dark;

  return (
    <KablaProvider>
      <div className={night ? "dark" : ""}>
        <div className={`min-h-dvh flex flex-col ${dusk || dark ? "room-dusk" : "room-paper"}`}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 bg-savanna text-paper">
            {t(lang, "skip")}
          </a>
          <SyntheticBanner lang={lang} />
          <header className="w-full px-6 md:px-10 xl:px-14 py-4">
            <div className="flex flex-wrap items-center gap-3">
              <Wordmark />
              <div className="ml-auto flex items-center gap-3">
                <LangToggle lang={lang} onChange={setLang} />
                <button
                  type="button"
                  className="stamp stamp-ghost text-xs"
                  aria-pressed={dark}
                  onClick={() => setDark(!dark)}
                >
                  {dark ? t(lang, "lampOff") : t(lang, "lampOn")}
                </button>
              </div>
            </div>
            <div className="mt-4 border-t border-current/25 pt-3">
              <JourneyRail lang={lang} />
            </div>
          </header>
          <div id="main" className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Desk lang={lang} />} />
              <Route path="/map" element={<ClauseMap lang={lang} />} />
              <Route path="/simulate" element={<Simulator lang={lang} />} />
              <Route path="/theater" element={<Theater lang={lang} />} />
              <Route path="/licence" element={<LicenceDesk lang={lang} />} />
              <Route path="/passport" element={<Passport lang={lang} />} />
              <Route path="/verify" element={<Verify lang={lang} />} />
            </Routes>
          </div>
          <p className="text-center text-[11px] tracking-[0.2em] uppercase opacity-45 py-10">
            {t(lang, "whisper")}
          </p>
        </div>
      </div>
    </KablaProvider>
  );
}
