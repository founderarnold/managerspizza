"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { canSeeBranch, getViewer, type Role } from "@/lib/auth";
import { getAllBranches, getBranches } from "@/lib/branches-db";
import { TIERS, type TierId } from "@/lib/tiers";
import { PRICE_SHEETS } from "@/lib/catalog";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads";
import { currentLists } from "@/lib/prices-db";
import type { FormState } from "./auth";
import { alertContact, alertCustomer, peso } from "@/lib/notify";
import { after as after_ } from "next/server";

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const isBranch = async (s: string) => (await getBranches()).some((b) => b.slug === s);
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
  if (assigned && !(await isBranch(assigned))) return { error: "Please choose a branch from the list." };
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
  // Tell the customer when the branch sends (or changes) its quotation.
  const prevQuote = (lead.quote ?? {}) as { reply?: string; amount?: number | null };
  if ((after.quote.reply && after.quote.reply !== prevQuote.reply) || (amount != null && amount !== prevQuote.amount)) {
    const a = {
      subject: `Your quotation ${lead.reference} from Manager's Pizza`,
      lines: [
        `Hi ${lead.name}, here is our reply to your request ${lead.reference}.`,
        ...(amount != null ? [`Quoted amount: ${peso(amount)}${validUntil ? `, valid until ${validUntil}` : ""}`] : []),
        ...(after.quote.reply ? [after.quote.reply] : []),
      ],
      link: lead.user_id ? { href: "/account", label: "See it in My account" } : { href: "/quote", label: "Visit Manager's Pizza" },
      sms: `Manager's Pizza: Reply to your request ${lead.reference}${amount != null ? `, quoted ${peso(amount)}` : ""}. ${lead.user_id ? "See managerspizza.com/account" : "We'll also call you."}`,
    };
    after_(() => (lead.user_id ? alertCustomer(lead.user_id, a, lead.mobile) : alertContact(lead.email, lead.mobile, a)));
  }
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
  if (branch && !(await isBranch(branch))) return { error: "Please choose a branch from the list." };
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
  if (status === "approved" && before.status !== "approved") {
    const tierName = TIERS.find((t) => t.id === tier)?.name ?? tier;
    after_(() =>
      alertCustomer(id, {
        subject: "Your Manager's Pizza account is approved",
        lines: [`Hi ${before.full_name}, your account is approved!`, `Your price level: ${tierName}. Sign in to see your prices, order online and track your deliveries.`],
        link: { href: "/shop", label: "Start ordering" },
        sms: `Manager's Pizza: Your account is approved (${tierName}). Sign in at managerspizza.com to see your prices and order.`,
      }),
    );
  }
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
  if (needsBranch && !(await isBranch(branch))) return { error: "Branch OIC and branch staff need a branch." };
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
  if (branch && !(await isBranch(branch))) return { error: "Unknown branch." };
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
    const branchName = branch ? (await getAllBranches()).find((b) => b.slug === branch)?.city ?? branch : "All branches";
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

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

/** Find a town's map pin with OpenStreetMap when the admin leaves the coordinates blank. */
async function geocode(city: string, province: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${city}, ${province}, Philippines`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${q}`, {
      headers: { "User-Agent": "managerspizza.com branch admin" },
      cache: "no-store",
    });
    const [hit] = (await res.json()) as { lat: string; lon: string }[];
    return hit ? [Number(hit.lat), Number(hit.lon)] : null;
  } catch {
    return null;
  }
}

/** Add a branch (slug empty) or update one. The public site picks it up right away. */
export async function saveBranch(slug: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const city = str(fd, "city", 80);
  const province = str(fd, "province", 80);
  const region = str(fd, "region", 20);
  const status = str(fd, "status", 20) || "open";
  if (!city || !province) return { error: "Please enter the city or town and the province." };
  if (!["Luzon", "Visayas", "Mindanao"].includes(region)) return { error: "Please choose Luzon, Visayas or Mindanao." };
  if (!["open", "opening_soon", "closed"].includes(status)) return { error: "Please choose a status." };

  let lat = Number(str(fd, "lat", 20));
  let lng = Number(str(fd, "lng", 20));
  const hasCoords = str(fd, "lat", 20) !== "" && str(fd, "lng", 20) !== "" && Number.isFinite(lat) && Number.isFinite(lng);
  if (!hasCoords) {
    const found = await geocode(city.replace(/\s*\(.*\)/, ""), province);
    if (!found) return { error: "We couldn't find that town on the map. Please type its latitude and longitude (in Google Maps, right-click the spot and click the numbers to copy them)." };
    [lat, lng] = found;
  }
  if (lat < 4 || lat > 22 || lng < 116 || lng > 127) return { error: "Those map numbers are outside the Philippines. Please check the latitude and longitude." };

  const phones = str(fd, "phones", 200).split(/[,/\n]+/).map((p) => p.trim()).filter(Boolean);
  const row = {
    name: str(fd, "name", 120) || `Manager's Pizza ${city.replace(/ City$/, "")}`,
    city,
    province,
    region,
    address: str(fd, "address", 300) || null,
    phones: phones.length ? phones : null,
    lat,
    lng,
    status,
  };

  if (slug) {
    const { data: before } = await db.from("branches").select("*").eq("slug", slug).maybeSingle();
    if (!before) return { error: "That branch no longer exists." };
    const { error } = await db.from("branches").update(row).eq("slug", slug);
    if (error) return { error: "We couldn't save this branch. Please try again." };
    await audit(v.id, "update_branch", "branches", slug, before, row);
  } else {
    let newSlug = slugify(`${city.replace(/ City$/i, "")} ${province}`);
    const { data: taken } = await db.from("branches").select("slug").like("slug", `${newSlug}%`);
    if (taken?.some((t) => t.slug === newSlug)) newSlug = `${newSlug}-${(taken?.length ?? 0) + 1}`;
    const { error } = await db.from("branches").insert({ slug: newSlug, ...row });
    if (error) return { error: "We couldn't add this branch. Please try again." };
    await audit(v.id, "add_branch", "branches", newSlug, null, row);
  }
  revalidateTag("branches");
  revalidatePath("/", "layout");
  return { ok: slug ? "Branch saved. The website shows the change now." : "Branch added. It now shows on the Branches map and in every branch list." };
}

/** Admin opens an account for a distributor, reseller or retailer, already approved with its price level and branch. */
export async function createAccount(_: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const full_name = str(fd, "name", 120);
  const mobile = str(fd, "mobile", 30);
  const email = str(fd, "email", 160).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const tier = str(fd, "tier", 20);
  const branch = str(fd, "branch", 60);
  if (!full_name) return { error: "Please enter their full name." };
  if (!/^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(mobile.replace(/\s+/g, " "))) return { error: "Please enter a Philippine mobile number, e.g. 0917 123 4567." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "The temporary password needs at least 8 characters." };
  if (!isTier(tier)) return { error: "Please choose a price level." };
  if (branch && !(await isBranch(branch))) return { error: "Please choose a branch from the list." };

  // Email not checked by the person yet: not shared with other FLAME PH sites until they sign in with FLAME PH once.
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name }, app_metadata: { email_unverified: true } });
  if (error || !data.user)
    return { error: /already|exists|registered/i.test(error?.message ?? "") ? "An account with this email already exists. Find it in the list below and change its price level there." : "We couldn't create the account. Please try again." };
  const now = new Date().toISOString();
  const profile = {
    id: data.user.id,
    email,
    full_name,
    mobile,
    business_name: str(fd, "businessName", 160) || null,
    business_type: str(fd, "businessType", 60) || null,
    province: str(fd, "province", 80) || null,
    city: str(fd, "city", 80) || null,
    branch_slug: branch || null,
    tier,
    status: "approved",
    approved_at: now,
    approved_by: v.id,
  };
  const { error: pErr } = await db.from("profiles").insert(profile);
  if (pErr) {
    await db.auth.admin.deleteUser(data.user.id);
    return { error: "We couldn't create the account. Please try again." };
  }
  await audit(v.id, "create_account", "profiles", data.user.id, null, { ...profile, id: undefined });
  revalidatePath("/admin", "layout");
  return { ok: `Account created for ${full_name}. Give them their email and temporary password; they can change the password under My account.` };
}
