import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashTabs, LeadTable, NotConfigured, StatCard } from "@/components/Dash";
import { OPEN_STATUSES, StatusFilter } from "@/components/StatusFilter";
import { requireViewer } from "@/lib/auth";
import { BRANCHES, branchName } from "@/lib/branches";
import type { Lead } from "@/lib/leads";
import { supabaseAdmin } from "@/lib/supabase-server";
import { tierName } from "@/lib/tiers";

export const metadata: Metadata = { title: "Branch dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BranchDashboard({ searchParams }: { searchParams: Promise<{ b?: string; status?: string }> }) {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const v = await requireViewer("/branch");
  const allowed = v.isAdmin ? BRANCHES.map((b) => b.slug) : v.staffBranches;
  if (allowed.length === 0) redirect("/account?denied=branch");
  const sp = await searchParams;
  const branch = sp.b && allowed.includes(sp.b) ? sp.b : allowed[0];

  // A request belongs to the branch it is assigned to, or (until assigned) the branch the customer picked.
  const scope = `assigned_branch.eq.${branch},and(assigned_branch.is.null,branch_slug.eq.${branch})`;
  let q = db.from("leads").select("*").or(scope).order("created_at", { ascending: false }).limit(200);
  if (!sp.status) q = q.in("status", OPEN_STATUSES);
  else if (sp.status !== "all") q = q.eq("status", sp.status);
  const [{ data: leads }, { data: counts }, { data: customers }] = await Promise.all([
    q,
    db.from("leads").select("status").or(scope),
    db.from("profiles").select("id, full_name, business_name, mobile, email, tier, status").eq("branch_slug", branch).order("created_at", { ascending: false }).limit(100),
  ]);
  const count = (s: string) => (counts ?? []).filter((c) => c.status === s).length;

  return (
    <div className="container-x py-8 md:py-12">
      <DashTabs viewer={v} active="branch" />
      <p className="eyebrow">Branch dashboard</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold md:text-4xl">{branchName(branch)}</h1>
        {allowed.length > 1 && (
          <form className="flex items-center gap-2">
            <label htmlFor="b" className="sr-only">Branch</label>
            <select id="b" name="b" defaultValue={branch} className="field !mt-0 !w-auto">
              {allowed.map((s) => <option key={s} value={s}>{branchName(s)}</option>)}
            </select>
            <button className="btn-dark">Open</button>
          </form>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="New" value={count("new")} href={`/branch?b=${branch}&status=new`} />
        <StatCard label="In review" value={count("in_review")} href={`/branch?b=${branch}&status=in_review`} />
        <StatCard label="Quoted" value={count("quoted")} href={`/branch?b=${branch}&status=quoted`} />
        <StatCard label="Accepted" value={count("accepted")} href={`/branch?b=${branch}&status=accepted`} />
      </div>

      <section className="mt-8" aria-labelledby="leads-h">
        <h2 id="leads-h" className="text-2xl font-bold">Requests</h2>
        <p className="mt-1 text-sm text-muted">Open a request to call the customer, send a quotation and update its status.</p>
        <div className="mt-4"><StatusFilter base="/branch" params={{ b: branch }} active={sp.status} /></div>
        <div className="mt-4"><LeadTable leads={(leads ?? []) as Lead[]} showBranch={false} /></div>
      </section>

      <section className="mt-10" aria-labelledby="cust-h">
        <h2 id="cust-h" className="text-2xl font-bold">Branch customers</h2>
        {(customers ?? []).length === 0 ? (
          <p className="card mt-4 p-6 text-center text-muted">No accounts have this as their home branch yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wide text-muted">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Price level</th><th className="px-4 py-3">Account</th></tr>
              </thead>
              <tbody>
                {(customers ?? []).map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-3"><span className="block font-medium">{c.full_name ?? "—"}</span><span className="text-xs text-muted">{c.business_name}</span></td>
                    <td className="px-4 py-3">{c.mobile && <a href={`tel:${c.mobile}`} className="block underline">{c.mobile}</a>}<span className="text-xs text-muted">{c.email}</span></td>
                    <td className="px-4 py-3">{tierName(c.tier)}</td>
                    <td className="px-4 py-3 capitalize">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {v.isAdmin && <p className="mt-3 text-sm"><Link href="/admin/accounts" className="font-medium text-brand-red-deep underline">Manage accounts in Admin</Link></p>}
      </section>
    </div>
  );
}
