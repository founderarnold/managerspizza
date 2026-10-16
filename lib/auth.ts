import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "./supabase-server";
import { supabaseSession } from "./supabase-session";
import type { TierId } from "./tiers";

export const ADMIN_ROLES = ["founder", "super_admin", "admin"] as const;
export const BRANCH_ROLES = ["branch_oic", "staff"] as const;

export const ROLE_LABEL: Record<string, string> = {
  founder: "Founder",
  super_admin: "Super admin",
  admin: "Admin",
  branch_oic: "Branch OIC",
  staff: "Branch staff",
  finance: "Finance",
};

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  mobile: string | null;
  business_name: string | null;
  business_type: string | null;
  province: string | null;
  city: string | null;
  account_type: string;
  tier: TierId | null;
  branch_slug: string | null;
  status: "pending" | "approved" | "suspended";
  created_at: string;
}

export interface StaffRole {
  id: number;
  user_id: string;
  role: string;
  branch_slug: string | null;
}

export interface Viewer {
  user: User;
  profile: Profile | null;
  roles: StaffRole[];
  isAdmin: boolean;
  isOwner: boolean;
  /** Branches this person works at (all branches for admins are handled separately). */
  staffBranches: string[];
}

/** Who is signed in, with their profile and staff roles. Null when signed out or Supabase isn't set up. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await supabaseSession();
  const db = supabaseAdmin();
  if (!session || !db) return null;
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: roles }] = await Promise.all([
    db.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    db.from("staff_roles").select("*").eq("user_id", user.id),
  ]);
  const list = (roles ?? []) as StaffRole[];
  return {
    user,
    profile: (profile as Profile) ?? null,
    roles: list,
    isAdmin: list.some((r) => (ADMIN_ROLES as readonly string[]).includes(r.role)),
    isOwner: list.some((r) => r.role === "founder" || r.role === "super_admin"),
    staffBranches: [
      ...new Set(
        list.filter((r) => (BRANCH_ROLES as readonly string[]).includes(r.role) && r.branch_slug).map((r) => r.branch_slug as string),
      ),
    ],
  };
}

export async function requireViewer(next: string) {
  const v = await getViewer();
  if (!v) redirect(`/login?next=${encodeURIComponent(next)}`);
  return v;
}

export async function requireAdmin(next: string) {
  const v = await requireViewer(next);
  if (!v.isAdmin) redirect("/account?denied=admin");
  return v;
}

/** Can this person work on a lead? Admins: any. Branch staff: leads assigned to (or, if unassigned, requested at) their branch. */
export function canManageLead(v: Viewer, lead: { assigned_branch: string | null; branch_slug: string | null }) {
  if (v.isAdmin) return true;
  const branch = lead.assigned_branch ?? lead.branch_slug;
  return !!branch && v.staffBranches.includes(branch);
}
