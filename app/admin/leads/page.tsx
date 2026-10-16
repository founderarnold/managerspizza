import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { DashTabs, LeadTable, NotConfigured } from "@/components/Dash";
import { OPEN_STATUSES, StatusFilter } from "@/components/StatusFilter";
import { requireAdmin } from "@/lib/auth";
import { BRANCHES } from "@/lib/branches";
import { KIND_LABEL, type Lead } from "@/lib/leads";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "All requests", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLeads({ searchParams }: { searchParams: Promise<{ status?: string; branch?: string; kind?: string; q?: string }> }) {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const v = await requireAdmin("/admin/leads");
  const sp = await searchParams;
  let q = db.from("leads").select("*").order("created_at", { ascending: false }).limit(300);
  if (!sp.status) q = q.in("status", OPEN_STATUSES);
  else if (sp.status !== "all") q = q.eq("status", sp.status);
  if (sp.branch === "none") q = q.is("assigned_branch", null);
  else if (sp.branch) q = q.or(`assigned_branch.eq.${sp.branch},and(assigned_branch.is.null,branch_slug.eq.${sp.branch})`);
  if (sp.kind && sp.kind in KIND_LABEL) q = q.eq("kind", sp.kind);
  const term = (sp.q ?? "").replace(/[,()%*]/g, " ").trim();
  if (term) q = q.or(`reference.ilike.%${term}%,name.ilike.%${term}%,mobile.ilike.%${term}%,email.ilike.%${term}%`);
  const { data } = await q;

  return (
    <div className="container-x py-8 md:py-12">
      <DashTabs viewer={v} active="admin" />
      <p className="eyebrow">Admin dashboard</p>
      <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">All requests</h1>
      <AdminNav active="/admin/leads" />
      <form className="mt-6 grid gap-3 sm:grid-cols-[1fr_200px_200px_auto]">
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <label className="sr-only" htmlFor="q">Search</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Search name, mobile, email or reference" className="field !mt-0" />
        <select name="branch" defaultValue={sp.branch ?? ""} className="field !mt-0" aria-label="Branch">
          <option value="">All branches</option>
          <option value="none">Not assigned</option>
          {BRANCHES.map((b) => <option key={b.slug} value={b.slug}>{b.city}</option>)}
        </select>
        <select name="kind" defaultValue={sp.kind ?? ""} className="field !mt-0" aria-label="Type">
          <option value="">All types</option>
          {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="btn-dark">Filter</button>
      </form>
      <div className="mt-4"><StatusFilter base="/admin/leads" params={{ branch: sp.branch, kind: sp.kind, q: sp.q }} active={sp.status} /></div>
      <div className="mt-4"><LeadTable leads={(data ?? []) as Lead[]} /></div>
    </div>
  );
}
