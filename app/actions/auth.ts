"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getViewer } from "@/lib/auth";
import { getBranches } from "@/lib/branches-db";

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
  redirect(safeNext(fd.get("next")));
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
  });
  if (pErr) {
    await db.auth.admin.deleteUser(data.user.id);
    return { error: "We couldn't create your account. Please try again." };
  }

  await sb.auth.signInWithPassword({ email, password });
  redirect("/account?welcome=1");
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb?.auth.signOut();
  redirect("/");
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
    : await db.from("profiles").insert({ ...row, id: v.id, email: v.email });
  if (error) return { error: "We couldn't save your details. Please try again." };
  revalidatePath("/account");
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
