"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ADMIN_ROLES, BRANCH_ROLES, canManageLead, requireAdmin, requireViewer } from "./auth";
import { BRANCHES } from "./branches";
import { LEAD_STATUSES, type LeadQuote } from "./leads";
import { supabaseAdmin } from "./supabase-server";
import { TIERS } from "./tiers";

const text = (fd: FormData, k: string, max = 200) => {
  const v = String(fd.get(k) ?? "").trim().slice(0, max);
  return v || null;
};
const money = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").replace(/[₱,\s]/g, "");
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const isBranch = (s: string | null) => !!s && BRANCHES.some((b) => b.slug === s);

function db() {
  const c = supabaseAdmin();
  if (!c) throw new Error("Supabase is not configured.");
  return c;
}

async function audit(actor: string, action: string, entity: string, entityId: string, before: unknown, after: unknown) {
  await db().from("audit_log").insert({ actor, action, entity, entity_id: entityId, before, after });
}

/** A customer edits their own contact details. Tier, branch and status are admin-only. */
export async function updateMyProfile(fd: FormData) {
  const v = await requireViewer("/account");
  const patch = {
    full_name: text(fd, "full_name", 120),
    mobile: text(fd, "mobile", 30),
    business_name: text(fd, "business_name", 120),
    business_type: text(fd, "business_type", 40),
    province: text(fd, "province", 80),
    city: text(fd, "city", 80),
  };
  const { error } = await db().from("profiles").upsert({ id: v.user.id, email: v.user.email, ...patch });
  if (error) redirect("/account?error=profile");
  revalidatePath("/account");
  redirect("/account?saved=profile#profile");
}

/** Branch staff and admins update a request: status, quotation, and (admins only) the branch handling it. */
export async function updateLead(fd: FormData) {
  const id = String(fd.get("id") ?? "");
  const v = await requireViewer(`/leads/${id}`);
  const { data: lead } = await db().from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead || !canManageLead(v, lead)) redirect("/account?denied=lead");

  const status = String(fd.get("status") ?? "");
  const quote: LeadQuote = {
    product_total: money(fd, "product_total"),
    shipping: money(fd, "shipping"),
    valid_until: text(fd, "valid_until", 10),
    payment_terms: text(fd, "payment_terms", 300),
    message: text(fd, "message", 2000),
    updated_by: v.profile?.full_name ?? v.user.email ?? null,
    updated_at: new Date().toISOString(),
  };
  const patch: Record<string, unknown> = { quote };
  if ((LEAD_STATUSES as readonly string[]).includes(status)) patch.status = status;
  if (v.isAdmin && fd.has("assigned_branch")) {
    const b = text(fd, "assigned_branch", 60);
    patch.assigned_branch = isBranch(b) ? b : null;
  }
  const { error } = await db().from("leads").update(patch).eq("id", id);
  if (error) redirect(`/leads/${id}?error=save`);
  await audit(v.user.id, "UPDATE", "leads", id, { status: lead.status, assigned_branch: lead.assigned_branch, quote: lead.quote }, patch);
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}?saved=1`);
}

/** Admin approves an account and sets its price tier and home branch. */
export async function updateAccount(fd: FormData) {
  const v = await requireAdmin("/admin/accounts");
  const id = String(fd.get("id") ?? "");
  const tier = text(fd, "tier", 20);
  const branch = text(fd, "branch_slug", 60);
  const status = text(fd, "status", 20);
  const type = text(fd, "account_type", 20);
  const patch = {
    tier: TIERS.some((t) => t.id === tier) ? tier : null,
    branch_slug: isBranch(branch) ? branch : null,
    status: ["pending", "approved", "suspended"].includes(status ?? "") ? status : "pending",
    account_type: ["customer", "partner", "staff"].includes(type ?? "") ? type : "customer",
  };
  const { data: before } = await db().from("profiles").select("tier, branch_slug, status, account_type").eq("id", id).maybeSingle();
  const { error } = await db().from("profiles").update(patch).eq("id", id);
  if (error) redirect("/admin/accounts?error=save");
  await audit(v.user.id, "UPDATE", "profiles", id, before, patch);
  revalidatePath("/admin/accounts");
  redirect(`/admin/accounts?saved=${id}#a-${id}`);
}

/** Admin gives someone (who already has an account) a staff role. Only the owner can make admins. */
export async function addStaffRole(fd: FormData) {
  const v = await requireAdmin("/admin/staff");
  const email = (text(fd, "email", 160) ?? "").toLowerCase();
  const role = text(fd, "role", 20) ?? "";
  const branch = text(fd, "branch_slug", 60);
  const adminRole = (ADMIN_ROLES as readonly string[]).includes(role);
  const branchRole = (BRANCH_ROLES as readonly string[]).includes(role);
  if (!adminRole && !branchRole) redirect("/admin/staff?error=role");
  if (adminRole && !v.isOwner) redirect("/admin/staff?error=owner");
  if (branchRole && !isBranch(branch)) redirect("/admin/staff?error=branch");
  const { data: profile } = await db().from("profiles").select("id").ilike("email", email).maybeSingle();
  if (!profile) redirect(`/admin/staff?error=noaccount&email=${encodeURIComponent(email)}`);
  const row = { user_id: profile.id, role, branch_slug: branchRole ? branch : null };
  const { error } = await db().from("staff_roles").insert(row);
  if (error && !/duplicate/i.test(error.message)) redirect("/admin/staff?error=save");
  await db().from("profiles").update({ account_type: "staff", status: "approved" }).eq("id", profile.id);
  await audit(v.user.id, "INSERT", "staff_roles", profile.id, null, row);
  revalidatePath("/admin/staff");
  redirect("/admin/staff?saved=1");
}

export async function removeStaffRole(fd: FormData) {
  const v = await requireAdmin("/admin/staff");
  const id = Number(fd.get("id"));
  const { data: row } = await db().from("staff_roles").select("*").eq("id", id).maybeSingle();
  if (!row) redirect("/admin/staff");
  if (row.user_id === v.user.id) redirect("/admin/staff?error=self");
  if ((ADMIN_ROLES as readonly string[]).includes(row.role) && !v.isOwner) redirect("/admin/staff?error=owner");
  await db().from("staff_roles").delete().eq("id", id);
  await audit(v.user.id, "DELETE", "staff_roles", row.user_id, row, null);
  revalidatePath("/admin/staff");
  redirect("/admin/staff?saved=1");
}
