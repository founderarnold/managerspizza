export type LeadStatus = "new" | "in_review" | "quoted" | "accepted" | "declined" | "expired" | "closed";
export type LeadKind = "quote" | "consultation" | "trial" | "partner";

export const LEAD_STATUSES: { id: LeadStatus; label: string; tone: string }[] = [
  { id: "new", label: "New", tone: "bg-brand-yellow-soft text-ink" },
  { id: "in_review", label: "In review", tone: "bg-[#e8f0ff] text-[#1d3f8a]" },
  { id: "quoted", label: "Quoted", tone: "bg-[#efe7ff] text-[#4b2a8a]" },
  { id: "accepted", label: "Accepted", tone: "bg-[#e3f4e8] text-success" },
  { id: "declined", label: "Declined", tone: "bg-[#fff1f1] text-brand-red-deep" },
  { id: "expired", label: "Expired", tone: "bg-sand text-muted" },
  { id: "closed", label: "Closed", tone: "bg-sand text-muted" },
];

export const KIND_LABEL: Record<LeadKind, string> = {
  quote: "Quotation",
  consultation: "Consultation",
  trial: "Trial order",
  partner: "Partner application",
};

export interface LeadItem {
  sheet?: string;
  name?: string;
  option?: string;
  unitPrice?: number | null;
  qty?: number;
}

/** What the branch sends back to the customer (stored in leads.quote). */
export interface LeadQuote {
  reply?: string;
  amount?: number | null;
  valid_until?: string | null;
}

export interface Lead {
  id: string;
  reference: string;
  kind: LeadKind;
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
  staff_notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export const leadBranch = (l: Pick<Lead, "assigned_branch" | "branch_slug">) => l.assigned_branch ?? l.branch_slug;

export function formatDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "–";
  return new Date(iso).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}
