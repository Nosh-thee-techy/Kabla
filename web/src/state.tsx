import { createContext, useContext, useState, type ReactNode } from "react";
import type { Analysis, Contract, LicenceVerdict, Nego, Passport, VerifyResult } from "./api";

type Store = {
  contract: Contract | null;
  analysis: Analysis | null;
  nego: Nego | null;
  licence: LicenceVerdict | null;
  passport: Passport | null;
  verify: VerifyResult | null;
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
  return (
    <Ctx.Provider value={{
      contract, analysis, nego, licence, passport, verify,
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
