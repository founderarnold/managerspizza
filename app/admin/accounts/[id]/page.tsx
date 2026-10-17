import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare, Phone } from "lucide-react";
import { requireAdmin, ROLE_LABEL, type Profile, type StaffRole } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allBranches } from "@/lib/branches-db";
import { formatDate, type Lead } from "@/lib/leads";
import { businessTypeLabel } from "@/lib/site";
import { AccountStatusBadge } from "@/components/dashboard/Badges";
import { AccountEditor, TempPasswordForm } from "@/components/dashboard/AdminForms";
import { LeadList } from "@/components/dashboard/LeadList";

export const metadata: Metadata = { title: "Account", robots: { index: false } };
export const dynamic = "force-dynamic";



export default async function AccountAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const BRANCHES = await allBranches();
  await requireAdmin(`/admin/accounts/${id}`);
  const db = supabaseAdmin()!;
  const [{ data }, { data: leads }, { data: roles }] = await Promise.all([
    db.from("profiles").select("*").eq("id", id).maybeSingle(),
    db.from("leads").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
    db.from("staff_roles").select("*").eq("user_id", id),
  ]);
  const p = data as Profile | null;
  if (!p) notFound();
  const tel = p.mobile.replace(/\s+/g, "");

  return (
    <div className="container-x py-8 md:py-12">
      <Link href="/admin?tab=accounts" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Accounts
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{p.full_name}</h1>
        <AccountStatusBadge status={p.status} />
        {(roles as StaffRole[] | null)?.map((r) => (
          <span key={r.id} className="chip">{ROLE_LABEL[r.role]}{r.branch_slug ? ` · ${BRANCHES.find((b) => b.slug === r.branch_slug)?.city}` : ""}</span>
        ))}
      </div>
      <p className="mt-1 text-muted">{p.email} · joined {formatDate(p.created_at)}{p.approved_at ? ` · approved ${formatDate(p.approved_at)}` : ""}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_440px]">
        <div className="grid content-start gap-6">
          <section className="card p-5">
            <h2 className="text-lg font-bold">Details from the customer</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["Mobile", p.mobile],
                ["Business name", p.business_name],
                ["Business type", p.business_type ? businessTypeLabel(p.business_type) : null],
                ["Location", [p.barangay, p.city, p.province].filter(Boolean).join(", ")],
                ["Address", p.address],
              ].map(([k, val]) => (
                <div key={k}>
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-medium">{val || "–"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${tel}`} className="btn-ghost"><Phone size={16} aria-hidden /> Call</a>
              <a href={`sms:${tel}`} className="btn-ghost"><MessageSquare size={16} aria-hidden /> SMS</a>
            </div>
          </section>
          <section>
            <h2 className="text-lg font-bold">Their requests</h2>
            <div className="mt-3">
              <LeadList leads={(leads ?? []) as Lead[]} showBranch />
            </div>
          </section>
        </div>
        <div className="grid content-start gap-6">
          <section className="card p-5">
            <h2 className="text-lg font-bold">Approval, price level and branch</h2>
            <div className="mt-4">
              <AccountEditor profile={p} />
            </div>
          </section>
          <section className="card p-5">
            <h2 className="text-lg font-bold">Forgot password?</h2>
            <p className="mt-1 text-sm text-muted">Set a temporary password, tell it to the customer by phone, and ask them to change it under My account.</p>
            <div className="mt-4">
              <TempPasswordForm id={p.id} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
