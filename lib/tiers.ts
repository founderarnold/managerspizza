export type TierId = "factory" | "regional" | "provincial" | "city" | "barangay";

/** The five account tiers. Admin assigns a tier; customers never choose it. */
export const TIERS: { id: TierId; name: string; who: string }[] = [
  { id: "factory", name: "Factory", who: "Company-owned branches" },
  { id: "regional", name: "Regional Distributor", who: "Regional distributors and approved networking companies" },
  { id: "provincial", name: "Provincial Distributor", who: "Provincial distributors" },
  { id: "city", name: "City Reseller", who: "City resellers, dropshippers and affiliates" },
  { id: "barangay", name: "Barangay Retailer", who: "Barangay retailers and walk-in buyers" },
];

export const tierName = (id: string | null | undefined) => TIERS.find((t) => t.id === id)?.name ?? "Not assigned yet";
