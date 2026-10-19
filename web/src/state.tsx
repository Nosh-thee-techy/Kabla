import { createContext, useContext, useState, type ReactNode } from "react";
import type { Analysis, Contract, Nego } from "./api";

type Store = {
  contract: Contract | null;
  analysis: Analysis | null;
  nego: Nego | null;
  setContract: (c: Contract | null) => void;
  setAnalysis: (a: Analysis | null) => void;
  setNego: (n: Nego | null) => void;
};

const Ctx = createContext<Store | null>(null);

export function KablaProvider({ children }: { children: ReactNode }) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [nego, setNego] = useState<Nego | null>(null);
  return (
    <Ctx.Provider value={{ contract, analysis, nego, setContract, setAnalysis, setNego }}>
      {children}
    </Ctx.Provider>
  );
}

export function useKabla(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useKabla outside provider");
  return v;
}
