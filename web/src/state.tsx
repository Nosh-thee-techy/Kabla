import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Analysis, Contract, LicenceVerdict, Nego, Passport, Profile, VerifyResult } from "./api";

/** The local "demo sign-in": a display name and an optional contact, kept only in this browser tab.
 *  Not an account: no password, nothing is sent to the API. See docs/DECISIONS.md (landing + demo sign-in). */
export type Account = { name: string; contact: string; at: string; onboarded: boolean };

type Store = {
  account: Account | null;
  setAccount: (a: Account | null) => void;
  /** "Sign out / start fresh": forgets the demo sign-in and every other kabla:* value kept in this tab. */
  signOut: () => void;
  contract: Contract | null;
  analysis: Analysis | null;
  nego: Nego | null;
  licence: LicenceVerdict | null;
  passport: Passport | null;
  verify: VerifyResult | null;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  setContract: (c: Contract | null) => void;
  setAnalysis: (a: Analysis | null) => void;
  setNego: (n: Nego | null) => void;
  setLicence: (v: LicenceVerdict | null) => void;
  setPassport: (p: Passport | null) => void;
  setVerify: (v: VerifyResult | null) => void;
};

const Ctx = createContext<Store | null>(null);

/** useState that survives a page reload.
 *
 *  Why sessionStorage and not localStorage: a visitor who reloads mid-demo keeps their place, but a new tab
 *  or a new visit starts clean at Before (so a shared computer never shows someone else's profile).
 *  Everything stored here is already server-side JSON (a contract, its analysis, a sealed profile, a passport);
 *  nothing secret. Storage can be blocked or full (private mode), so every access is wrapped: if it fails the
 *  app behaves exactly as before and simply forgets on reload. */
function usePersisted<T>(key: string): [T | null, (v: T | null) => void] {
  const full = `kabla:${key}`;
  const [value, setValue] = useState<T | null>(() => {
    try {
      const raw = sessionStorage.getItem(full);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null; // blocked storage or a corrupt value: start empty
    }
  });
  const set = useCallback((v: T | null) => {
    setValue(v);
    try {
      if (v === null) sessionStorage.removeItem(full);
      else sessionStorage.setItem(full, JSON.stringify(v));
    } catch { /* storage full or blocked: keep working in memory */ }
  }, [full]);
  return [value, set];
}

export function KablaProvider({ children }: { children: ReactNode }) {
  const [contract, setContract] = usePersisted<Contract>("contract");
  const [analysis, setAnalysis] = usePersisted<Analysis>("analysis");
  const [nego, setNego] = usePersisted<Nego>("nego");
  const [licence, setLicence] = usePersisted<LicenceVerdict>("licence");
  const [passport, setPassport] = usePersisted<Passport>("passport");
  const [verify, setVerify] = usePersisted<VerifyResult>("verify");
  const [profile, setProfile] = usePersisted<Profile>("profile");
  const [account, setAccount] = usePersisted<Account>("account");
  const signOut = useCallback(() => {
    // Clear every kabla:* key (also any a future room adds), then the in-memory copies.
    try {
      for (const k of Object.keys(sessionStorage)) if (k.startsWith("kabla:")) sessionStorage.removeItem(k);
    } catch { /* storage blocked: the in-memory reset below still works */ }
    setAccount(null); setProfile(null); setContract(null); setAnalysis(null);
    setNego(null); setLicence(null); setPassport(null); setVerify(null);
  }, [setAccount, setProfile, setContract, setAnalysis, setNego, setLicence, setPassport, setVerify]);
  return (
    <Ctx.Provider value={{
      account, setAccount, signOut,
      contract, analysis, nego, licence, passport, verify, profile, setProfile,
      setContract, setAnalysis, setNego, setLicence, setPassport, setVerify,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useKabla(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKabla outside provider");
  return v;
}

/** Who the After rooms are about. An open contract wins; else a demo-fixture profile; else the demo artist.
 *  Why not any typed profile: the passport, financier and verify rooms run on the synthetic work
 *  "Asali ya Jioni", which belongs to the demo artists. A typed profile holds facts and gaps only. */
export function useArtist(): string {
  const { contract, profile } = useKabla();
  if (contract) return contract.artist;
  if (profile && profile.source.includes("fixture")) return profile.id;
  return "zawadi";
}
