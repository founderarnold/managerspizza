import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, Package, ShieldCheck, Store, Tag, Wallet } from "lucide-react";
import { OPEN_ORDER_STATUSES } from "@/lib/orders";
import { staffConversations } from "@/lib/messages-db";
import { requireStaff, type Profile } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { TIERS } from "@/lib/tiers";
import type { Lead } from "@/lib/leads";
import { AccountStatusBadge, Stat } from "@/components/dashboard/Badges";
import { LeadList, OPEN_STATUSES, StatusFilter } from "@/components/dashboard/LeadList";

export const metadata: Metadata = { title: "Branch dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BranchDashboard({ searchParams }: { searchParams: Promise<{ b?: string; status?: string }> }) {
  const BRANCHES = await getAllBranches();
  const v = await requireStaff("/branch");
  const sp = await searchParams;
  const mine = v.isAdmin ? BRANCHES : BRANCHES.filter((b) => v.staffBranches?.includes(b.slug));
  const branch = mine.find((b) => b.slug === sp.b) ?? mine[0];
  const status = sp.status ?? "open";
  const db = supabaseAdmin()!;

  if (!branch) return <p className="container-x py-12">No branch is linked to your account yet. Please ask an admin.</p>;

  const inBranch = `assigned_branch.eq.${branch.slug},and(assigned_branch.is.null,branch_slug.eq.${branch.slug})`;
  let q = db.from("leads").select("*").or(inBranch).order("created_at", { ascending: false }).limit(200);
  if (status === "open") q = q.in("status", OPEN_STATUSES);
  else if (status !== "all") q = q.eq("status", status);
  const [{ data: leads }, { data: all }, { data: customers }] = await Promise.all([
    q,
    db.from("leads").select("status,created_at").or(inBranch).limit(5000),
    db.from("profiles").select("*").eq("branch_slug", branch.slug).order("created_at", { ascending: false }).limit(200),
  ]);
  const counts = (s: string) => (all ?? []).filter((l) => l.status === s).length;
  const [{ data: orders }, inbox] = await Promise.all([
    db.from("orders").select("status").eq("branch_slug", branch.slug).in("status", OPEN_ORDER_STATUSES).limit(5000),
    staffConversations(v, 500),
  ]);
  const orderCount = (s: string) => (orders ?? []).filter((o) => s === "open" || o.status === s).length;
  const unreadChats = inbox.filter((c) => c.status === "open" && c.last_message_at > c.staff_read_at).length;
  const weekAgo = Date.now() - 7 * 864e5;
  const thisWeek = (all ?? []).filter((l) => new Date(l.created_at).getTime() > weekAgo).length;

  return (
    <div className="container-x py-8 md:py-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Branch dashboard</p>
          <h1 className="mt-1 flex items-center gap-2 text-3xl font-extrabold md:text-4xl">
            <Store size={30} aria-hidden /> {branch.city}
          </h1>
          <p className="mt-1 text-muted">{branch.name}</p>
        </div>
        {v.isAdmin && (
          <Link href="/admin" className="btn-dark"><ShieldCheck size={18} aria-hidden /> Admin dashboard</Link>
        )}
      </div>

      {mine.length > 1 && (
        <nav aria-label="Branches" className="mt-6 flex gap-2 overflow-x-auto pb-1">
          {mine.map((b) => (
            <Link
              key={b.slug}
              href={`/branch?b=${b.slug}`}
              aria-current={b.slug === branch.slug ? "page" : undefined}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${b.slug === branch.slug ? "border-brand-red-deep bg-brand-red-deep text-white" : "border-line bg-white hover:border-ink/40"}`}
            >
              {b.city}
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href={`/branch/orders?b=${branch.slug}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
          <Package size={22} className="text-brand-red-deep" aria-hidden />
          <span><span className="block font-display text-2xl font-bold tabular-nums">{orderCount("open")}</span><span className="text-sm text-muted">Open orders</span></span>
        </Link>
        <Link href={`/branch/orders?b=${branch.slug}&status=payment_review`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
          <Wallet size={22} className="text-brand-red-deep" aria-hidden />
          <span><span className="block font-display text-2xl font-bold tabular-nums">{orderCount("payment_review")}</span><span className="text-sm text-muted">Payments to check</span></span>
        </Link>
        <Link href="/branch/messages" className="card flex items-center gap-3 p-4 hover:shadow-lift">
          <MessageSquare size={22} className="text-brand-red-deep" aria-hidden />
          <span><span className="block font-display text-2xl font-bold tabular-nums">{unreadChats}</span><span className="text-sm text-muted">Unread messages</span></span>
        </Link>
        <Link href={`/account/prices?branch=${branch.slug}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
          <Tag size={22} className="text-brand-red-deep" aria-hidden />
          <span><span className="block font-semibold">Price lists</span><span className="text-sm text-muted">All levels</span></span>
        </Link>
      </div>

      <h2 className="mt-8 text-xl font-bold">Quotation requests</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="New requests" value={counts("new")} />
        <Stat label="In review" value={counts("in_review")} />
        <Stat label="Quoted, waiting" value={counts("quoted")} />
        <Stat label="Received this week" value={thisWeek} />
      </div>

      <section className="mt-10" aria-labelledby="req-h">
        <h2 id="req-h" className="text-2xl font-bold">Requests</h2>
        <div className="mt-3">
          <StatusFilter base={`/branch?b=${branch.slug}`} current={status} />
        </div>
        <div className="mt-4">
          <LeadList leads={(leads ?? []) as Lead[]} />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="cust-h">
        <h2 id="cust-h" className="text-2xl font-bold">Customers of this branch</h2>
        <p className="mt-1 text-sm text-muted">Accounts that chose {branch.city} as their branch. Price levels and approvals are set by an admin.</p>
        {(customers ?? []).length === 0 ? (
          <p className="card mt-4 p-6 text-muted">No customer accounts yet.</p>
        ) : (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Business</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Price level</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(customers as Profile[]).map((c) => (
                  <tr key={c.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3 font-medium">{c.full_name}</td>
                    <td className="px-4 py-3">{c.business_name ?? "–"}</td>
                    <td className="px-4 py-3"><a className="underline" href={`tel:${c.mobile.replace(/\s+/g, "")}`}>{c.mobile}</a></td>
                    <td className="px-4 py-3">{TIERS.find((t) => t.id === c.tier)?.name}</td>
                    <td className="px-4 py-3"><AccountStatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
