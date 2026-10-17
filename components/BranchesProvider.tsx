"use client";

import { createContext, useContext } from "react";
import { BRANCHES, type Branch } from "@/lib/branches";

const Ctx = createContext<Branch[]>(BRANCHES);

/** Makes the current branch list (from the database) available to client components. */
export function BranchesProvider({ branches, children }: { branches: Branch[]; children: React.ReactNode }) {
  return <Ctx.Provider value={branches}>{children}</Ctx.Provider>;
}

/** All branches, including closed ones. */
export const useAllBranches = () => useContext(Ctx);
/** Branches a customer can choose: open ones. */
export const useOpenBranches = () => useContext(Ctx).filter((b) => (b.status ?? "open") === "open");
