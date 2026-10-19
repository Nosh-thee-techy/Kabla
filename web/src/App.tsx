import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { LangToggle } from "./components/LangToggle";
import { SyntheticBanner } from "./components/SyntheticBanner";
import { t, type Lang } from "./i18n";
import { ClauseMap } from "./pages/ClauseMap";
import { Desk } from "./pages/Desk";
import { LicenceDesk } from "./pages/LicenceDesk";
import { Passport } from "./pages/Passport";
import { Simulator } from "./pages/Simulator";
import { Theater } from "./pages/Theater";
import { Verify } from "./pages/Verify";
import { KablaProvider } from "./state";

const NAV = [
  { to: "/", key: "desk" as const },
  { to: "/map", key: "map" as const },
  { to: "/simulate", key: "sim" as const },
  { to: "/theater", key: "theater" as const },
  { to: "/licence", key: "licence" as const },
  { to: "/passport", key: "passport" as const },
  { to: "/verify", key: "verify" as const },
];

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const [dark, setDark] = useState(false);
  return (
    <KablaProvider>
      <div className={dark ? "dark" : ""}>
        <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2 bg-savanna text-paper">
            Skip to content
          </a>
          <SyntheticBanner lang={lang} />
          <header className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
            <p className="font-display text-2xl">Kabla</p>
            <nav className="flex flex-wrap gap-3 text-sm">
              {NAV.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === "/"}
                  className={({ isActive }) => isActive ? "underline decoration-terracotta decoration-2" : "hover:underline"}>
                  {t(lang, l.key)}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <LangToggle lang={lang} onChange={setLang} />
              <button type="button" className="text-sm underline" aria-pressed={dark}
                onClick={() => setDark(!dark)}>
                {dark ? "Light" : "Dark"}
              </button>
            </div>
          </header>
          <div id="main">
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
        </div>
      </div>
    </KablaProvider>
  );
}
