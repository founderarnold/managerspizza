export const SITE = {
  name: "Manager's Pizza",
  url: "https://www.managerspizza.com",
  tagline: "Pizza supplies, business packages and partner programs for Filipino pizza entrepreneurs.",
  phones: ["0946 697 5253", "0999 886 2235"],
  phoneLinks: ["+639466975253", "+639998862235"],
  address: "Villongco St., Commonwealth, Quezon City",
};

export const NAV = [
  { href: "/shop", label: "Shop Supplies" },
  { href: "/start-a-business", label: "Start a Pizza Business" },
  { href: "/branches", label: "Branches" },
  { href: "/partners", label: "Partners" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
];

export const PRICE_NOTE =
  "Temporary price list for all branches and account tiers, based on the Quezon City depot list of 2 May 2026. Prices are subject to change without prior notice and may soon vary per branch and account level. Shipping is paid by the buyer and quoted separately.";

/** "I am a" choices on sign-up, profile, quotation and admin forms. */
export const BUSINESS_TYPES = [
  { id: "new", label: "New entrepreneur" },
  { id: "store", label: "Existing pizza store" },
  { id: "distributor", label: "Distributor" },
  { id: "reseller", label: "Reseller" },
  { id: "retailer", label: "Retailer (sari-sari, grocery)" },
  { id: "dropshipper", label: "Dropshipper / online seller" },
  { id: "other", label: "Other" },
] as const;
export const businessTypeLabel = (id: string | null | undefined) => BUSINESS_TYPES.find((t) => t.id === id)?.label ?? id ?? "";
