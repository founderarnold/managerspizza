import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads";
import type { AccountStatus } from "@/lib/auth";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const s = LEAD_STATUSES.find((x) => x.id === status) ?? LEAD_STATUSES[0];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.tone}`}>{s.label}</span>;
}

const ACCOUNT_TONE: Record<AccountStatus, [string, string]> = {
  pending: ["Waiting for approval", "bg-brand-yellow-soft text-ink"],
  approved: ["Approved", "bg-[#e3f4e8] text-success"],
  suspended: ["Suspended", "bg-[#fff1f1] text-brand-red-deep"],
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  const [label, tone] = ACCOUNT_TONE[status];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

export function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
