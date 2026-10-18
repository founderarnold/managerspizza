"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getViewer, selfServeTier } from "@/lib/auth";
import { alertCustomer, alertStaff } from "@/lib/notify";
import { after } from "next/server";
import { getBranches } from "@/lib/branches-db";
import { HUB_URL, SSO_CLIENT, SSO_COOKIE, ssoEnabled } from "@/lib/flame-sso";
import { cookies } from "next/headers";

export type FormState = { error?: string; ok?: string } | null;

const str = (fd: FormData, k: string, max = 200) => String(fd.get(k) ?? "").trim().slice(0, max);
const PH_MOBILE = /^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeNext(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
}

const UNAVAILABLE = "Accounts are not available right now. Please call or SMS the Quezon City depot.";

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const sb = await supabaseServer();
  if (!sb) return { error: UNAVAILABLE };
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Please enter your email and password." };
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match. Please try again." };
  // Pass through flameph.org (one FLAME PH account) when SSO is on; otherwise straight to the page.
  const next = safeNext(fd.get("next"));
  redirect(ssoEnabled() ? `/auth/flame/push?next=${encodeURIComponent(next)}` : next);
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const sb = await supabaseServer();
  const db = supabaseAdmin();
  if (!sb || !db) return { error: UNAVAILABLE };

  const full_name = str(fd, "name", 120);
  const mobile = str(fd, "mobile", 30);
  const email = str(fd, "email", 160).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const branch = str(fd, "branch", 60);
  if (!full_name) return { error: "Please enter your full name." };
  if (!PH_MOBILE.test(mobile.replace(/\s+/g, " "))) return { error: "Please enter a Philippine mobile number, e.g. 0917 123 4567." };
  if (!EMAIL.test(email)) return { error: "Please enter a valid email address." };
  if (password.length < 8) return { error: "Your password needs at least 8 characters." };
  if (password !== String(fd.get("password2") ?? "")) return { error: "The two passwords don't match." };
  if (fd.get("consent") !== "on") return { error: "Please agree to the Privacy Notice to create an account." };
  if (branch && !(await getBranches()).some((b) => b.slug === branch)) return { error: "Please choose a branch from the list." };

  // Created already confirmed, so no confirmation email is needed. An admin approves the account.
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
    // The email isn't checked here, so it isn't shared with other FLAME PH sites until proven (see lib/flame-sso.ts).
    app_metadata: { email_unverified: true },
  });
  if (error || !data.user) {
    const taken = /already|exists|registered/i.test(error?.message ?? "");
    return { error: taken ? "An account with this email already exists. Please sign in instead." : "We couldn't create your account. Please try again." };
  }

  const { error: pErr } = await db.from("profiles").insert({
    id: data.user.id,
    email,
    full_name,
    mobile,
    business_name: str(fd, "businessName", 160) || null,
    business_type: str(fd, "businessType", 60) || null,
    province: str(fd, "province", 80) || null,
    city: str(fd, "city", 80) || null,
    barangay: str(fd, "barangay", 80) || null,
    branch_slug: branch || null,
    // No approval needed to shop: the price level follows the business type (see selfServeTier).
    tier: selfServeTier(str(fd, "businessType", 60)),
    status: "approved",
  });
  if (pErr) {
    await db.auth.admin.deleteUser(data.user.id);
    return { error: "We couldn't create your account. Please try again." };
  }

  await sb.auth.signInWithPassword({ email, password });
  const biz = str(fd, "businessName", 160);
  after(() =>
    Promise.all([
      alertStaff(branch || null, {
        subject: `New customer: ${full_name}`,
        lines: [`${full_name}${biz ? ` (${biz})` : ""} created an account.`, `${email} · ${mobile}${str(fd, "city", 80) ? ` · ${str(fd, "city", 80)}` : ""}`, str(fd, "businessType", 60) === "distributor" ? "They chose Distributor. Distributor prices need an approved Exclusive Distributor application." : "They can already see their prices and order."],
        link: { href: `/admin/accounts/${data.user.id}`, label: "Review the account" },
      }),
      alertCustomer(data.user.id, {
        subject: "Welcome to Manager's Pizza",
        lines: [`Hi ${full_name}, your account is created.`, "You can already see your prices and order online. Applying to be an Exclusive Distributor with territorial rights? Send your application on the Partners page and we'll review it."],
        link: { href: "/account", label: "My account" },
      }),
    ]),
  );
  redirect("/account?welcome=1");
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb?.auth.signOut();
  if (!ssoEnabled()) redirect("/");
  // Stay logged out: no automatic sign-in from flameph.org until they sign in again, and log out there too.
  (await cookies()).set(SSO_COOKIE, "off", { maxAge: 60 * 60 * 24 * 30, path: "/", sameSite: "lax", secure: true, httpOnly: true });
  redirect(`${HUB_URL}/sso/logout?client=${SSO_CLIENT}&return=${encodeURIComponent("https://www.managerspizza.com/")}`);
}

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return { error: "Please sign in again." };
  const full_name = str(fd, "name", 120);
  const mobile = str(fd, "mobile", 30);
  if (!full_name) return { error: "Please enter your full name." };
  if (!PH_MOBILE.test(mobile.replace(/\s+/g, " "))) return { error: "Please enter a Philippine mobile number, e.g. 0917 123 4567." };
  const row = {
    full_name,
    mobile,
    business_name: str(fd, "businessName", 160) || null,
    business_type: str(fd, "businessType", 60) || null,
    province: str(fd, "province", 80) || null,
    city: str(fd, "city", 80) || null,
    barangay: str(fd, "barangay", 80) || null,
    address: str(fd, "address", 300) || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = v.profile
    ? await db.from("profiles").update(row).eq("id", v.id)
    : await db.from("profiles").insert({
        ...row,
        id: v.id,
        email: v.email,
        branch_slug: (await getBranches()).some((b) => b.slug === str(fd, "branch", 60)) ? str(fd, "branch", 60) : null,
        tier: selfServeTier(row.business_type),
        status: "approved",
      });
  if (error) return { error: "We couldn't save your details. Please try again." };
  if (!v.profile) {
    // A FLAME PH member's first visit: let the team know a new customer joined.
    after(() =>
      alertStaff(str(fd, "branch", 60) || null, {
        subject: `New customer: ${full_name}`,
        lines: [`${full_name}${row.business_name ? ` (${row.business_name})` : ""} joined with their FLAME PH account.`, `${v.email} · ${mobile}${row.city ? ` · ${row.city}` : ""}`, str(fd, "businessType", 60) === "distributor" ? "They chose Distributor. Distributor prices need an approved Exclusive Distributor application." : "They can already see their prices and order."],
        link: { href: `/admin/accounts/${v.id}`, label: "Review the account" },
      }),
    );
  }
  revalidatePath("/account");
  const next = safeNext(fd.get("next"));
  if (fd.get("next")) redirect(next);
  return { ok: "Saved." };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const sb = await supabaseServer();
  if (!sb) return { error: UNAVAILABLE };
  const password = String(fd.get("password") ?? "");
  if (password.length < 8) return { error: "Your password needs at least 8 characters." };
  if (password !== String(fd.get("password2") ?? "")) return { error: "The two passwords don't match." };
  const { error } = await sb.auth.updateUser({ password });
  if (error) return { error: "We couldn't change your password. Please sign in again and retry." };
  return { ok: "Password changed." };
}
