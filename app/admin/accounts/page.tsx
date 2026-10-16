import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { DashTabs, Notice, NotConfigured } from "@/components/Dash";
import { requireAdmin, type Profile } from "@/lib/auth";
import { updateAccount } from "@/lib/actions";
import { BRANCHES } from "@/lib/branches";
import { formatDate } from "@/lib/leads";
import { supabaseAdmin } from "@/lib/supabase-server";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = { title: "Accounts", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUSES = ["pending", "approved", "suspended"];

export default async function AdminAccounts({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; saved?: string; error?: string }> }) {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const v = await requireAdmin("/admin/accounts");
  const sp = await searchParams;
  let q = db.from("profiles").select("*").order("created_at", { ascending: false }).limit(300);
  if (sp.status && STATUSES.includes(sp.status)) q = q.eq("status", sp.status);
  const term = (sp.q ?? "").replace(/[,()%*]/g, " ").trim();
  if (term) q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%,business_name.ilike.%${term}%`);
  const { data, error } = await q;
  const accounts = (data ?? []) as Profile[];

  return (
    <div className="container-x py-8 md:py-12">
      <DashTabs viewer={v} active="admin" />
      <p className="eyebrow">Admin dashboard</p>
      <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Accounts</h1>
      <AdminNav active="/admin/accounts" />
      <p className="mt-4 text-sm text-muted">Approve new sign-ups and set each account&apos;s price level and home branch. Customers see prices for their level once approved.</p>
      <div className="mt-3 grid gap-2">
        {sp.saved && <Notice kind="ok">Account saved.</Notice>}
        {(sp.error || error) && <Notice kind="error">Something went wrong. If this keeps happening, the accounts database update may not be installed yet.</Notice>}
      </div>
      <form className="mt-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search name, email, mobile, business" className="field !mt-0 sm:max-w-sm" aria-label="Search accounts" />
        <select name="status" defaultValue={sp.status ?? ""} className="field !mt-0 !w-auto" aria-label="Status">
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="btn-dark">Filter</button>
      </form>

      {accounts.length === 0 ? (
        <p className="card mt-6 p-6 text-center text-muted">No accounts found.</p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {accounts.map((a) => (
            <li key={a.id} id={`a-${a.id}`} className={`card p-5 ${sp.saved === a.id ? "ring-2 ring-success" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold">{a.full_name ?? a.email}</p>
                  <p className="text-sm text-muted">
                    {[a.business_name, a.email, a.mobile, [a.city, a.province].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-muted">Joined {formatDate(a.created_at)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${a.status === "approved" ? "bg-success text-white" : a.status === "pending" ? "bg-brand-yellow" : "bg-sand text-muted"}`}>{a.status}</span>
              </div>
              <form action={updateAccount} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
                <input type="hidden" name="id" value={a.id} />
                <label className="label">Price level
                  <select name="tier" defaultValue={a.tier ?? ""} className="field">
                    <option value="">Not set</option>
                    {TIERS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
                <label className="label">Home branch
                  <select name="branch_slug" defaultValue={a.branch_slug ?? ""} className="field">
                    <option value="">Not set</option>
                    {BRANCHES.map((b) => <option key={b.slug} value={b.slug}>{b.city}</option>)}
                  </select>
                </label>
                <label className="label">Type
                  <select name="account_type" defaultValue={a.account_type} className="field">
                    <option value="customer">Customer</option>
                    <option value="partner">Partner</option>
                    <option value="staff">Staff</option>
                  </select>
                </label>
                <label className="label">Status
                  <select name="status" defaultValue={a.status} className="field">
                    {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </label>
                <button className="btn-primary">Save</button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted">Price levels: {TIERS.map((t) => `${t.name} (${t.who.toLowerCase()})`).join("; ")}. To make someone branch staff, go to <Link href="/admin/staff" className="underline">Staff</Link>.</p>
    </div>
  );
}
