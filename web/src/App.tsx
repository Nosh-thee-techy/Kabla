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
import { Onboard } from "./pages/Onboard";
import { Passport } from "./pages/Passport";
import { PassportIssued } from "./pages/PassportIssued";
import { SignCheck } from "./pages/SignCheck";
import { Simulator } from "./pages/Simulator";
import { Theater } from "./pages/Theater";
import { Verify } from "./pages/Verify";
import { Financier } from "./pages/Financier";
import { KablaProvider } from "./state";
import { AccountChip } from "./components/AccountChip";
import { Landing } from "./pages/Landing";
import { Onboarding } from "./pages/Onboarding";
import { SignIn } from "./pages/SignIn";

// The front door (landing, demo sign-in, set-up wizard) is a dark "night desk" room and has no journey rail.
const FRONT = new Set(["/", "/signin", "/welcome"]);
const DUSK = new Set(["/", "/signin", "/welcome", "/theater", "/passport", "/passport/issued", "/financier", "/verify"]);

export default function App() {
  // The language is a preference, so it survives reloads and new visits (localStorage, like the lamp).
  const [lang, setLangState] = useState<Lang>(() => {
    try { return localStorage.getItem("kabla-lang") === "sw" ? "sw" : "en"; }
    catch { return "en"; }
  });
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("kabla-lang", l); } catch { /* ignore */ }
  };
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
          <header className="w-full border-b hair">
            <div className="max-w-[1240px] mx-auto px-4 md:px-6 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-2">
              <Wordmark />
              <div className="order-3 md:order-none basis-full md:basis-auto min-w-0 max-w-full md:flex-1 md:flex md:justify-center">
                {!FRONT.has(pathname) && <JourneyRail lang={lang} />}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <AccountChip lang={lang} />
                <LangToggle lang={lang} onChange={setLang} />
                <button
                  type="button"
                  className="stamp stamp-ghost !px-3 !py-1.5 !text-[11px]"
                  aria-pressed={dark}
                  onClick={() => setDark(!dark)}
                >
                  {dark ? t(lang, "lampOff") : t(lang, "lampOn")}
                </button>
              </div>
            </div>
          </header>
          <div id="main" className="flex-1 flex flex-col">
            <Routes>
              <Route path="/onboard" element={<Onboard lang={lang} />} />
              <Route path="/" element={<Landing lang={lang} />} />
              <Route path="/signin" element={<SignIn lang={lang} />} />
              <Route path="/welcome" element={<Onboarding lang={lang} setLang={setLang} />} />
              <Route path="/desk" element={<Desk lang={lang} />} />
              <Route path="/map" element={<ClauseMap lang={lang} />} />
              <Route path="/simulate" element={<Simulator lang={lang} />} />
              <Route path="/theater" element={<Theater lang={lang} />} />
              <Route path="/check" element={<SignCheck lang={lang} />} />
              <Route path="/licence" element={<LicenceDesk lang={lang} />} />
              <Route path="/passport" element={<Passport lang={lang} />} />
              <Route path="/passport/issued" element={<PassportIssued lang={lang} />} />
              <Route path="/financier" element={<Financier lang={lang} />} />
              <Route path="/verify" element={<Verify lang={lang} />} />
            </Routes>
          </div>
          <p className="text-center font-mono text-[10px] tracking-[0.2em] uppercase opacity-45 py-5 border-t hair">
            {t(lang, "whisper")}
          </p>
        </div>
      </div>
    </KablaProvider>
  );
}
