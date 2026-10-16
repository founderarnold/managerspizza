import type { Metadata } from "next";
import { AdminNav } from "@/components/AdminNav";
import { DashTabs, Notice, NotConfigured } from "@/components/Dash";
import { requireAdmin, ROLE_LABEL, type StaffRole } from "@/lib/auth";
import { addStaffRole, removeStaffRole } from "@/lib/actions";
import { BRANCHES, branchName } from "@/lib/branches";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Staff", robots: { index: false } };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  noaccount: "That email has no account yet. Ask them to create one on the Sign in page first, then add them here.",
  owner: "Only the founder or a super admin can add or remove admins.",
  branch: "Please pick the branch for this person.",
  self: "You can't remove your own access.",
  role: "Please pick a role.",
  save: "Something went wrong. Please try again.",
};

export default async function AdminStaff({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; email?: string }> }) {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const v = await requireAdmin("/admin/staff");
  const sp = await searchParams;
  const { data: roles } = await db.from("staff_roles").select("*").order("role");
  const list = (roles ?? []) as StaffRole[];
  const ids = [...new Set(list.map((r) => r.user_id))];
  const { data: people } = ids.length ? await db.from("profiles").select("id, full_name, email").in("id", ids) : { data: [] };
  const who = (id: string) => people?.find((p) => p.id === id);

  return (
    <div className="container-x py-8 md:py-12">
      <DashTabs viewer={v} active="admin" />
      <p className="eyebrow">Admin dashboard</p>
      <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Staff</h1>
      <AdminNav active="/admin/staff" />
      <div className="mt-4 grid gap-2">
        {sp.saved && <Notice kind="ok">Staff access updated.</Notice>}
        {sp.error && <Notice kind="error">{ERRORS[sp.error] ?? ERRORS.save}</Notice>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="list-h">
          <h2 id="list-h" className="text-xl font-bold">Who has access</h2>
          <ul className="mt-4 grid gap-3">
            {list.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{who(r.user_id)?.full_name ?? who(r.user_id)?.email ?? "Unknown"}</p>
                  <p className="text-sm text-muted">{who(r.user_id)?.email} · {ROLE_LABEL[r.role] ?? r.role}{r.branch_slug ? ` · ${branchName(r.branch_slug)}` : ""}</p>
                </div>
                {r.user_id !== v.user.id && (
                  <form action={removeStaffRole}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn-ghost !min-h-9 !px-3 text-sm">Remove</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
        <section className="card content-start p-6" aria-labelledby="add-h">
          <h2 id="add-h" className="text-xl font-bold">Give someone access</h2>
          <p className="mt-1 text-sm text-muted">They must create an account on the Sign in page first.</p>
          <form action={addStaffRole} className="mt-4 grid gap-4">
            <label className="label">Their email<input className="field" name="email" type="email" required defaultValue={sp.email} /></label>
            <label className="label">Role
              <select name="role" className="field" defaultValue="branch_oic">
                <option value="branch_oic">Branch OIC (runs a branch)</option>
                <option value="staff">Branch staff</option>
                {v.isOwner && <option value="admin">Admin (all branches)</option>}
                {v.isOwner && <option value="super_admin">Super admin (can add admins)</option>}
              </select>
            </label>
            <label className="label">Branch (for branch roles)
              <select name="branch_slug" className="field" defaultValue="">
                <option value="">Pick a branch</option>
                {BRANCHES.map((b) => <option key={b.slug} value={b.slug}>{b.city}, {b.province}</option>)}
              </select>
            </label>
            <button className="btn-primary">Give access</button>
          </form>
        </section>
      </div>
    </div>
  );
}
