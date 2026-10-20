import { createContext, useContext, useState, type ReactNode } from "react";
import type { Analysis, Contract, LicenceVerdict, Nego, Passport, Profile, VerifyResult } from "./api";

type Store = {
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

export function KablaProvider({ children }: { children: ReactNode }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [nego, setNego] = useState<Nego | null>(null);
  const [licence, setLicence] = useState<LicenceVerdict | null>(null);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  return (
    <Ctx.Provider value={{
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