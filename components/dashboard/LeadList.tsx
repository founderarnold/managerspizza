import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { allBranches } from "@/lib/branches-db";
import { KIND_LABEL, LEAD_STATUSES, formatDate, leadBranch, type Lead } from "@/lib/leads";
import { LeadStatusBadge } from "./Badges";

export const OPEN_STATUSES = ["new", "in_review", "quoted"];

/** Status filter chips: "open" (default), "all", or one status. */
export function StatusFilter({ base, current }: { base: string; current: string }) {
  const opts = [{ id: "open", label: "Open" }, ...LEAD_STATUSES.map((s) => ({ id: s.id, label: s.label })), { id: "all", label: "All" }];
  const join = base.includes("?") ? "&" : "?";
  return (
    <nav aria-label="Filter by status" className="flex gap-2 overflow-x-auto pb-1">
      {opts.map((o) => (
        <Link
          key={o.id}
          href={`${base}${join}status=${o.id}`}
          aria-current={current === o.id ? "page" : undefined}
          className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${current === o.id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}

export async function LeadList({ leads, showBranch = false }: { leads: Lead[]; showBranch?: boolean }) {
  const BRANCHES = await allBranches();
  if (leads.length === 0) return <p className="card p-6 text-muted">No requests here.</p>;
  return (
    <ul className="grid gap-2">
      {leads.map((l) => {
        const b = BRANCHES.find((x) => x.slug === leadBranch(l));
        return (
          <li key={l.id}>
            <Link href={`/branch/requests/${l.id}`} className="card flex items-center gap-3 p-4 transition hover:shadow-lift">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong className="font-display tracking-wide">{l.reference}</strong>
                  <LeadStatusBadge status={l.status} />
                  {showBranch && <span className="chip">{b ? b.city : "No branch"}</span>}
                </div>
                <p className="mt-1 truncate text-sm">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-muted"> · {l.mobile} · {[l.city, l.province].filter(Boolean).join(", ") || "no location"}</span>
                </p>
                <p className="text-xs text-muted">
                  {KIND_LABEL[l.kind]} · {l.items?.length ?? 0} item{l.items?.length === 1 ? "" : "s"} · {formatDate(l.created_at, true)}
                </p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
