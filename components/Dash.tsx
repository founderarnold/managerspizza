import Link from "next/link";
import { branchName } from "@/lib/branches";
import { formatPeso } from "@/lib/catalog";
import { KIND_LABEL, STATUS_LABEL, STATUS_STYLE, formatDate, type Lead } from "@/lib/leads";
import type { Viewer } from "@/lib/auth";

export function StatusBadge({ status }: { status: Lead["status"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? "bg-sand"}`}>{STATUS_LABEL[status] ?? status}</span>;
}

/** Tabs across the dashboards this person can open. */
export function DashTabs({ viewer, active }: { viewer: Viewer; active: "account" | "branch" | "admin" }) {
  const tabs = [
    { id: "account", href: "/account", label: "My account", show: true },
    { id: "branch", href: "/branch", label: "Branch dashboard", show: viewer.staffBranches.length > 0 || viewer.isAdmin },
    { id: "admin", href: "/admin", label: "Admin", show: viewer.isAdmin },
  ].filter((t) => t.show);
  if (tabs.length < 2) return null;
  return (
    <nav aria-label="Dashboards" className="mb-6 flex gap-1 overflow-x-auto rounded-full bg-white p-1 shadow-soft sm:inline-flex">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={active === t.id ? "page" : undefined}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold ${active === t.id ? "bg-ink text-white" : "text-graphite hover:bg-sand"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

export const quoteTotal = (l: Lead) =>
  l.quote && (l.quote.product_total != null || l.quote.shipping != null) ? (l.quote.product_total ?? 0) + (l.quote.shipping ?? 0) : null;

/** Staff list of requests; each row opens the request page. */
export function LeadTable({ leads, showBranch = true }: { leads: Lead[]; showBranch?: boolean }) {
  if (leads.length === 0) return <p className="card p-6 text-center text-muted">No requests here yet.</p>;
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-sand text-left text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Type</th>
            {showBranch && <th className="px-4 py-3">Branch</th>}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Quoted</th>
            <th className="px-4 py-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => {
            const total = quoteTotal(l);
            return (
              <tr key={l.id} className="border-t border-line hover:bg-cream/60">
                <td className="px-4 py-3 font-semibold">
                  <Link href={`/leads/${l.id}`} className="text-brand-red-deep underline-offset-2 hover:underline">{l.reference}</Link>
                </td>
                <td className="px-4 py-3">
                  <span className="block font-medium">{l.name}</span>
                  <span className="text-xs text-muted">{[l.city, l.province].filter(Boolean).join(", ") || l.mobile}</span>
                </td>
                <td className="px-4 py-3">{KIND_LABEL[l.kind] ?? l.kind}</td>
                {showBranch && (
                  <td className="px-4 py-3">
                    {l.assigned_branch ? branchName(l.assigned_branch) : <span className="text-muted">{l.branch_slug ? `Asked: ${branchName(l.branch_slug)}` : "Unassigned"}</span>}
                  </td>
                )}
                <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                <td className="px-4 py-3 text-right tabular-nums">{total == null ? "–" : formatPeso(total)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(l.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="font-display text-3xl font-bold tabular-nums">{value}</p>
    </>
  );
  return href ? <Link href={href} className="card block p-5 transition hover:shadow-lift">{body}</Link> : <div className="card p-5">{body}</div>;
}

export function Notice({ kind = "info", children }: { kind?: "info" | "ok" | "error"; children: React.ReactNode }) {
  const style = kind === "ok" ? "bg-success/10 text-success" : kind === "error" ? "bg-brand-red-deep/10 text-brand-red-deep" : "bg-brand-yellow-soft text-ink";
  return <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm font-medium ${style}`}>{children}</p>;
}

export function NotConfigured() {
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-lg p-8 text-center">
        <h1 className="text-2xl font-bold">Sign-in isn&apos;t switched on yet</h1>
        <p className="mt-3 text-muted">Please call or text a branch while we finish setting up accounts.</p>
      </div>
    </div>
  );
}
