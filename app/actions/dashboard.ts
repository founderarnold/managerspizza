"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { canSeeBranch, getViewer, type Role } from "@/lib/auth";
import { BRANCHES } from "@/lib/branches";
import { TIERS, type TierId } from "@/lib/tiers";
import { PRICE_SHEETS } from "@/lib/catalog";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads";
import { currentLists } from "@/lib/prices-db";
import type { FormState } from "./auth";

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const isBranch = (s: string) => BRANCHES.some((b) => b.slug === s);
const isTier = (s: string): s is TierId => TIERS.some((t) => t.id === s);
const DENIED: FormState = { error: "You don't have access to do that." };

async function audit(actor: string, action: string, entity: string, entityId: string, before: unknown, after: unknown, reason?: string) {
  await supabaseAdmin()!.from("audit_log").insert({ actor, action, entity, entity_id: entityId, before, after, reason: reason ?? null });
}

export async function updateLead(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db || !v.isStaff) return DENIED;
  const { data: lead } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead || !canSeeBranch(v, lead.assigned_branch ?? lead.branch_slug)) return DENIED;

  const status = str(fd, "status") as LeadStatus;
  if (!LEAD_STATUSES.some((s) => s.id === status)) return { error: "Please choose a status." };
  const assigned = str(fd, "assignedBranch", 60);
  if (assigned && !isBranch(assigned)) return { error: "Please choose a branch from the list." };
  // Moving a request to another branch: admins, or the OIC of the branch it is in now.
  const current = lead.assigned_branch ?? lead.branch_slug;
  const isOic = v.roles.some((r) => r.role === "branch_oic" && r.branch_slug === current);
  if ((assigned || null) !== (lead.assigned_branch ?? null) && assigned !== current && !v.isAdmin && !isOic)
    return { error: "Only an admin or the branch OIC can move a request to another branch." };

  const amountRaw = str(fd, "amount", 20).replace(/[₱,\s]/g, "");
  const amount = amountRaw ? Number(amountRaw) : null;
  if (amount != null && !(amount >= 0)) return { error: "Please enter the quoted amount as a number." };
  const validUntil = str(fd, "validUntil", 10) || null;

  const after = {
    status,
    assigned_branch: assigned || null,
    quote: { reply: str(fd, "reply", 2000) || undefined, amount, valid_until: validUntil },
    staff_notes: str(fd, "staffNotes", 4000) || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("leads").update(after).eq("id", id);
  if (error) return { error: "We couldn't save this request. Please try again." };
  await audit(v.id, "update", "leads", lead.reference, { status: lead.status, assigned_branch: lead.assigned_branch, quote: lead.quote }, after);
  revalidatePath("/branch", "layout");
  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}

export async function updateAccount(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const { data: before } = await db.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!before) return { error: "Account not found." };
  const tier = str(fd, "tier");
  const status = str(fd, "status");
  const branch = str(fd, "branch", 60);
  if (!isTier(tier)) return { error: "Please choose a price level." };
  if (!["pending", "approved", "suspended"].includes(status)) return { error: "Please choose a status." };
  if (branch && !isBranch(branch)) return { error: "Please choose a branch from the list." };
  const after: Record<string, unknown> = {
    tier,
    status,
    branch_slug: branch || null,
    admin_notes: str(fd, "adminNotes", 2000) || null,
    updated_at: new Date().toISOString(),
  };
  if (status === "approved" && before.status !== "approved") {
    after.approved_at = new Date().toISOString();
    after.approved_by = v.id;
  }
  const { error } = await db.from("profiles").update(after).eq("id", id);
  if (error) return { error: "We couldn't save this account. Please try again." };
  await audit(v.id, "update", "profiles", before.email, { tier: before.tier, status: before.status, branch_slug: before.branch_slug }, after);
  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}

export async function setTemporaryPassword(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "The temporary password needs at least 8 characters." };
  const { error } = await db.auth.admin.updateUserById(id, { password });
  if (error) return { error: "We couldn't set the password. Please try again." };
  await audit(v.id, "reset_password", "auth.users", id, null, null);
  return { ok: "Temporary password set. Give it to the customer and ask them to change it under My account." };
}

const GRANTABLE: Role[] = ["super_admin", "admin", "branch_oic", "staff", "finance"];

export async function addStaff(_: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const email = str(fd, "email", 160).toLowerCase();
  const role = str(fd, "role") as Role;
  const branch = str(fd, "branch", 60);
  if (!GRANTABLE.includes(role) && !(role === "founder" && v.roles.some((r) => r.role === "founder")))
    return { error: "Please choose a role." };
  const needsBranch = role === "branch_oic" || role === "staff";
  if (needsBranch && !isBranch(branch)) return { error: "Branch OIC and branch staff need a branch." };
  const { data: p } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!p) return { error: "No account uses that email yet. Ask them to create an account first (Sign in → Create an account), then add them here." };
  const { error } = await db.from("staff_roles").insert({ user_id: p.id, role, branch_slug: needsBranch || branch ? branch || null : null });
  if (error) return { error: /duplicate|unique/i.test(error.message) ? "They already have that role." : "We couldn't add this role. Please try again." };
  // Staff accounts are approved accounts.
  await db.from("profiles").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: v.id }).eq("id", p.id).neq("status", "approved");
  await audit(v.id, "grant_role", "staff_roles", email, null, { role, branch });
  revalidatePath("/admin", "layout");
  return { ok: "Role added." };
}

export async function removeStaff(roleId: number) {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return;
  const { data: r } = await db.from("staff_roles").select("*").eq("id", roleId).maybeSingle();
  if (!r || r.user_id === v.id) return; // never remove your own role
  await db.from("staff_roles").delete().eq("id", roleId);
  await audit(v.id, "revoke_role", "staff_roles", String(roleId), r, null);
  revalidatePath("/admin", "layout");
}

export async function savePrices(_: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const branch = str(fd, "branch", 60) || null;
  const tierRaw = str(fd, "tier") || null;
  const sheet = PRICE_SHEETS.find((s) => s.slug === str(fd, "sheet"));
  const reason = str(fd, "reason", 300);
  if (branch && !isBranch(branch)) return { error: "Unknown branch." };
  if (tierRaw && !isTier(tierRaw)) return { error: "Unknown price level." };
  const tier = tierRaw as TierId | null;
  if (!sheet) return { error: "Unknown price sheet." };
  if (!reason) return { error: "Please write a short reason for this change (it is kept in the audit log)." };

  const items: { sheet_slug: string; row_key: string; column_key: string; amount: number }[] = [];
  for (const r of sheet.rows)
    for (const c of sheet.columns) {
      const raw = str(fd, `p:${r.key}:${c.key}`, 20).replace(/[₱,\s]/g, "");
      if (!raw) continue;
      const n = Number(raw);
      if (!(n >= 0) || n > 10_000_000) return { error: `Please check the price for ${r.label}, ${c.label}.` };
      items.push({ sheet_slug: sheet.slug, row_key: r.key, column_key: c.key, amount: Math.round(n * 100) / 100 });
    }

  let listId = (await currentLists())?.get(`${branch}|${tier}`);
  if (!listId) {
    const branchName = branch ? BRANCHES.find((b) => b.slug === branch)!.city : "All branches";
    const tierName = tier ? TIERS.find((t) => t.id === tier)!.name : "All levels";
    const { data, error } = await db
      .from("price_lists")
      .insert({
        branch_slug: branch,
        tier,
        name: `${branchName} · ${tierName}`,
        effective_from: new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" }),
        reason,
        created_by: v.id,
      })
      .select("id")
      .single();
    if (error || !data) return { error: "We couldn't create the price list. Please try again." };
    listId = data.id as string;
  }

  const { data: before } = await db.from("price_list_items").select("row_key,column_key,amount").eq("price_list_id", listId).eq("sheet_slug", sheet.slug);
  const { error: delErr } = await db.from("price_list_items").delete().eq("price_list_id", listId).eq("sheet_slug", sheet.slug);
  if (delErr) return { error: "We couldn't save the prices. Please try again." };
  if (items.length) {
    const { error } = await db.from("price_list_items").insert(items.map((i) => ({ ...i, price_list_id: listId })));
    if (error) {
      if (before?.length) await db.from("price_list_items").insert(before.map((b) => ({ ...b, sheet_slug: sheet.slug, price_list_id: listId })));
      return { error: "We couldn't save the prices. Nothing was changed." };
    }
  }
  await audit(v.id, "save_prices", "price_list_items", `${branch ?? "all"}:${tier ?? "all"}:${sheet.slug}`, before, items, reason);
  revalidatePath("/", "layout");
  return { ok: `Saved ${items.length} price${items.length === 1 ? "" : "s"} for ${sheet.name}.` };
}
