import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase-server";
import type { TierId } from "./tiers";

export type Role = "founder" | "super_admin" | "admin" | "branch_oic" | "staff" | "finance";
export type AccountStatus = "pending" | "approved" | "suspended";

export const ROLE_LABEL: Record<Role, string> = {
  founder: "Founder",
  super_admin: "Super admin",
  admin: "Admin",
  branch_oic: "Branch OIC",
  staff: "Branch staff",
  finance: "Finance",
};
export const ADMIN_ROLES: Role[] = ["founder", "super_admin", "admin"];
export const BRANCH_ROLES: Role[] = ["branch_oic", "staff"];

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  mobile: string;
  business_name: string | null;
  business_type: string | null;
  province: string | null;
  city: string | null;
  barangay: string | null;
  address: string | null;
  branch_slug: string | null;
  tier: TierId;
  status: AccountStatus;
  admin_notes: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface StaffRole {
  id: number;
  user_id: string;
  role: Role;
  branch_slug: string | null;
}

export interface Viewer {
  id: string;
  email: string;
  profile: Profile | null;
  roles: StaffRole[];
  isAdmin: boolean;
  /** Branches whose dashboard this user may open. Admins: every branch (null). */
  staffBranches: string[] | null;
  isStaff: boolean;
}

/** Emails that are always treated as admins (comma-separated env var), for the first login. */
function bootstrapAdmins() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in user with profile and staff roles, or null. Cached per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const sb = await supabaseServer();
  const db = supabaseAdmin();
  if (!sb || !db) return null;
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const email = (user.email ?? "").toLowerCase();

  const [{ data: profile }, { data: roles }] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    db.from("staff_roles").select("*").eq("user_id", user.id),
  ]);
  const staffRoles = (roles ?? []) as StaffRole[];
  const isAdmin = bootstrapAdmins().includes(email) || staffRoles.some((r) => ADMIN_ROLES.includes(r.role));
  const branchSlugs = staffRoles.filter((r) => r.branch_slug && (BRANCH_ROLES.includes(r.role) || r.role === "finance")).map((r) => r.branch_slug!);
  const staffBranches = isAdmin ? null : [...new Set(branchSlugs)];

  return {
    id: user.id,
    email,
    profile: (profile as Profile | null) ?? null,
    roles: staffRoles,
    isAdmin,
    staffBranches,
    isStaff: isAdmin || branchSlugs.length > 0,
  };
});

export async function requireViewer(next: string) {
  const v = await getViewer();
  if (!v) redirect(`/login?next=${encodeURIComponent(next)}`);
  return v;
}

export async function requireAdmin(next = "/admin") {
  const v = await requireViewer(next);
  if (!v.isAdmin) redirect("/account");
  return v;
}

export async function requireStaff(next = "/branch") {
  const v = await requireViewer(next);
  if (!v.isStaff) redirect("/account");
  return v;
}

export function canSeeBranch(v: Viewer, branch: string | null | undefined) {
  if (v.isAdmin) return true;
  return !!branch && (v.staffBranches ?? []).includes(branch);
}

/** Anyone with an account can see their prices and order right away; only suspended accounts can't. */
export const canOrder = (p: Pick<Profile, "status"> | null | undefined): p is Profile => !!p && p.status !== "suspended";

/**
 * The price level a new account starts with, without approval: resellers and online sellers get City Reseller,
 * everyone else Barangay Retailer. Distributor levels (and Factory) are given only by an admin, after an Exclusive
 * Distributor application with territorial rights is approved.
 */
export function selfServeTier(businessType: string | null | undefined): TierId {
  return businessType === "reseller" || businessType === "dropshipper" ? "city" : "barangay";
}
