"use client";

import { createContext, useContext } from "react";
import { DEFAULT_BRANCHES, type Branch } from "@/lib/branches";

const Ctx = createContext<Branch[]>(DEFAULT_BRANCHES);

export function BranchesProvider({ branches, children }: { branches: Branch[]; children: React.ReactNode }) {
  return <Ctx.Provider value={branches}>{children}</Ctx.Provider>;
}

/** The live branch list (not closed), for client components. */
export const useBranches = () => useContext(Ctx);
