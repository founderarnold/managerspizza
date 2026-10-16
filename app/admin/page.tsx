import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { DashTabs, LeadTable, NotConfigured, StatCard } from "@/components/Dash";
import { requireAdmin } from "@/lib/auth";
import { BRANCHES, branchName } from "@/lib/branches";
import type { Lead } from "@/lib/leads";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const v = await requireAdmin("/admin");
  const [{ data: all }, { data: recent }, { count: pending }, { count: accounts }] = await Promise.all([
    db.from("leads").select("status, assigned_branch, branch_slug"),
    db.from("leads").select("*").order("created_at", { ascending: false }).limit(10),
    db.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const rows = all ?? [];
  const n = (f: (r: (typeof rows)[number]) => boolean) => rows.filter(f).length;
  const open = (r: (typeof rows)[number]) => ["new", "in_review", "quoted", "accepted"].includes(r.status);

  return (
    <div className="container-x py-8 md:py-12">
      <DashTabs viewer={v} active="admin" />
      <p className="eyebrow">Admin dashboard</p>
      <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Manager&apos;s Pizza HQ</h1>
      <AdminNav active="/admin" />

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="New requests" value={n((r) => r.status === "new")} href="/admin/leads?status=new" />
        <StatCard label="Not assigned to a branch" value={n((r) => open(r) && !r.assigned_branch)} href="/admin/leads?branch=none" />
        <StatCard label="Accounts to approve" value={pending ?? 0} href="/admin/accounts?status=pending" />
        <StatCard label="All accounts" value={accounts ?? 0} href="/admin/accounts" />
      </div>

      <section className="mt-10" aria-labelledby="rb-h">
        <h2 id="rb-h" className="text-2xl font-bold">Open requests by branch</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BRANCHES.map((b) => {
            const mine = rows.filter((r) => open(r) && (r.assigned_branch ?? r.branch_slug) === b.slug);
            return (
              <li key={b.slug}>
                <Link href={`/branch?b=${b.slug}`} className="card flex items-center justify-between p-4 transition hover:shadow-lift">
                  <span className="font-medium">{branchName(b.slug)}</span>
                  <span className="flex items-center gap-2 text-sm">
                    {mine.some((r) => r.status === "new") && <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-bold">{mine.filter((r) => r.status === "new").length} new</span>}
                    <span className="font-display text-xl font-bold tabular-nums">{mine.length}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="recent-h">
        <div className="flex items-center justify-between">
          <h2 id="recent-h" className="text-2xl font-bold">Latest requests</h2>
          <Link href="/admin/leads" className="text-sm font-medium text-brand-red-deep underline">See all</Link>
        </div>
        <div className="mt-4"><LeadTable leads={(recent ?? []) as Lead[]} /></div>
      </section>
    </div>
  );
}
