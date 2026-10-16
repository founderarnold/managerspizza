export const LEAD_STATUSES = ["new", "in_review", "quoted", "accepted", "declined", "expired", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  in_review: "In review",
  quoted: "Quoted",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  closed: "Closed",
};

export const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-brand-yellow text-ink",
  in_review: "bg-brand-yellow-soft text-ink",
  quoted: "bg-ink text-white",
  accepted: "bg-success text-white",
  declined: "bg-sand text-muted",
  expired: "bg-sand text-muted",
  closed: "bg-sand text-muted",
};

export const KIND_LABEL: Record<string, string> = {
  quote: "Quotation",
  consultation: "Business consultation",
  trial: "Pizza trial",
  partner: "Partner application",
};

export interface LeadQuote {
  product_total?: number | null;
  shipping?: number | null;
  valid_until?: string | null;
  payment_terms?: string | null;
  message?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
}

export interface LeadItem {
  sheet?: string;
  name?: string;
  option?: string;
  unitPrice?: number | null;
  qty?: number;
}

export interface Lead {
  id: string;
  reference: string;
  kind: string;
  status: LeadStatus;
  name: string;
  mobile: string;
  email: string | null;
  business_type: string | null;
  province: string | null;
  city: string | null;
  barangay: string | null;
  address: string | null;
  branch_slug: string | null;
  assigned_branch: string | null;
  fulfillment: string | null;
  notes: string | null;
  items: LeadItem[];
  details: Record<string, unknown>;
  quote: LeadQuote | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" });
