export interface Program {
  slug: string;
  name: string;
  short: string;
  who: string;
  get: string[];
  requirements: string[];
}

export const PROGRAMS: Program[] = [
  {
    slug: "affiliate",
    name: "Affiliate Program",
    short: "Earn by referring buyers of standard pizza supplies.",
    who: "Content creators, community leaders and anyone who recommends Manager's Pizza supplies.",
    get: [
      "3% of eligible net merchandise sales on standard supply SKUs",
      "30-day last-click attribution; a valid affiliate code at checkout takes priority",
      "Monthly payout by the 15th, ₱1,000 minimum; smaller balances carry over",
    ],
    requirements: ["Verified identity and payout account in your legal name", "Tax documents for withholding"],
  },
  {
    slug: "dropshipper",
    name: "Become a Dropshipper",
    short: "Sell Manager's Pizza supplies online; we fulfil from the nearest branch.",
    who: "Online sellers who want to offer pizza supplies without holding stock.",
    get: ["City Reseller catalog access", "Fulfilment from the nearest eligible branch"],
    requirements: ["Active selling channel", "Valid ID and business registration if any"],
  },
  {
    slug: "distributor",
    name: "Distributor",
    short: "Carry Manager's Pizza supplies across your region or province.",
    who: "Regional and provincial distributors with storage and delivery capacity.",
    get: ["Regional or Provincial Distributor price level", "An assigned territory", "Branch support for orders and deliveries"],
    requirements: ["Business permit", "DTI or SEC registration", "BIR certificate of registration", "Storage that fits the products (freezer for frozen goods)"],
  },
  {
    slug: "reseller-retailer",
    name: "Reseller & Retailer",
    short: "Sell Manager's Pizza supplies in your city, town or barangay.",
    who: "City resellers, sari-sari stores, bakeries and barangay retailers.",
    get: ["City Reseller or Barangay Retailer price level", "Approved resale margin", "Pickup or delivery from the nearest branch"],
    requirements: ["Valid ID", "Barangay or business permit if you have one", "A freezer or chiller for frozen and chilled items"],
  },
  {
    slug: "networking-company",
    name: "Networking Company",
    short: "Bring Manager's Pizza packages to your members.",
    who: "Established networking and referral companies.",
    get: ["Regional Distributor tier", "A separate written direct-referral schedule"],
    requirements: ["SEC registration and company documents", "Signed agreement. No multi-level or downline earnings."],
  },
  {
    slug: "supplier",
    name: "Supplier Accreditation",
    short: "Supply ingredients, packaging or equipment to the Manager's Pizza network.",
    who: "Manufacturers and traders of pizza ingredients, packaging and equipment.",
    get: ["Listing of approved products in the catalog", "Orders from branches and partners in your approved territory"],
    requirements: ["Business permit, DTI/SEC and BIR registration", "Product specifications and certifications (e.g. FDA where applicable)", "Written fulfilment and service commitments"],
  },
];
