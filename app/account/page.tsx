import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Building2, ClipboardList, Clock, LayoutDashboard, LogOut, ShieldCheck, Tag } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { allBranches } from "@/lib/branches-db";
import { TIERS } from "@/lib/tiers";
import { formatPeso } from "@/lib/catalog";
import { KIND_LABEL, formatDate, type Lead } from "@/lib/leads";
import { signOut } from "@/app/actions/auth";
import { AccountStatusBadge, LeadStatusBadge } from "@/components/dashboard/Badges";
import { PasswordForm, ProfileForm } from "@/components/auth/AccountForms";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const v = await requireViewer("/account");
  const { welcome } = await searchParams;
  const BRANCHES = await allBranches();
  const p = v.profile;
  const { data } = await supabaseAdmin()!.from("leads").select("*").eq("user_id", v.id).order("created_at", { ascending: false }).limit(50);
  const leads = (data ?? []) as Lead[];
  const tier = TIERS.find((t) => t.id === p?.tier);
  const branch = BRANCHES.find((b) => b.slug === p?.branch_slug);
  const approved = p?.status === "approved";

  return (
    <div className="container-x py-8 md:py-12">
      {welcome && (
        <p role="status" className="mb-6 rounded-2xl border border-success/30 bg-[#e3f4e8] p-4 text-sm text-success">
          Welcome to Manager&apos;s Pizza! Your account is created. Our team will review it and set your price level.
        </p>
      )}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Hi, {p?.full_name?.split(" ")[0] ?? "there"}!</h1>
          <p className="mt-1 text-muted">{v.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {v.isStaff && (
            <Link href="/branch" className="btn-dark">
              <LayoutDashboard size={18} aria-hidden /> Branch dashboard
            </Link>
          )}
          {v.isAdmin && (
            <Link href="/admin" className="btn-dark">
              <ShieldCheck size={18} aria-hidden /> Admin dashboard
            </Link>
          )}
          <form action={signOut}>
            <button className="btn-ghost" type="submit">
              <LogOut size={18} aria-hidden /> Sign out
            </button>
          </form>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><BadgeCheck size={16} aria-hidden /> Account status</p>
          <div className="mt-2">{p ? <AccountStatusBadge status={p.status} /> : <span className="text-sm">Complete your details below</span>}</div>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><Tag size={16} aria-hidden /> Price level</p>
          <p className="mt-1 text-lg font-bold">{approved && tier ? tier.name : "To be assigned"}</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><Building2 size={16} aria-hidden /> Your branch</p>
          <p className="mt-1 text-lg font-bold">{branch ? branch.city : "To be assigned"}</p>
        </div>
      </div>

      {p?.status === "pending" && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-brand-yellow bg-brand-yellow-soft/50 p-4 text-sm leading-relaxed">
          <Clock size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <strong>Your account is waiting for approval.</strong> Manager&apos;s Pizza will check your details and set your price level and branch, usually within one business day. You can already send quotation requests. Questions? Call or SMS {SITE.phones[0]}.
          </span>
        </div>
      )}
      {p?.status === "suspended" && (
        <p className="mt-4 rounded-2xl border border-brand-red-deep/30 bg-[#fff1f1] p-4 text-sm text-brand-red-deep">
          Your account is on hold. Please call {SITE.phones[0]} for help.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        {approved && (
          <Link href="/account/prices" className="btn-primary">
            <Tag size={18} aria-hidden /> My price list
          </Link>
        )}
        <Link href="/quote" className={approved ? "btn-ghost" : "btn-primary"}>
          <ClipboardList size={18} aria-hidden /> New quotation request
        </Link>
      </div>

      <section className="mt-10" aria-labelledby="req-h">
        <h2 id="req-h" className="text-2xl font-bold">My requests</h2>
        {leads.length === 0 ? (
          <p className="card mt-4 p-6 text-muted">No requests yet. Requests you send while signed in will appear here with their status and the branch&apos;s reply.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {leads.map((l) => (
              <li key={l.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <strong className="font-display text-lg tracking-wide">{l.reference}</strong>
                  <LeadStatusBadge status={l.status} />
                  <span className="text-sm text-muted">{KIND_LABEL[l.kind]} · {formatDate(l.created_at)}</span>
                </div>
                {l.items?.length > 0 && (
                  <p className="mt-2 text-sm text-graphite">
                    {l.items.slice(0, 4).map((i) => `${i.qty ?? 1} × ${i.name}${i.option ? ` (${i.option})` : ""}`).join(" · ")}
                    {l.items.length > 4 && ` · +${l.items.length - 4} more`}
                  </p>
                )}
                {(l.quote?.reply || l.quote?.amount != null) && (
                  <div className="mt-3 rounded-xl bg-sand p-3 text-sm">
                    <p className="font-semibold">Reply from Manager&apos;s Pizza</p>
                    {l.quote?.amount != null && <p className="mt-1">Quoted amount: <strong>{formatPeso(l.quote.amount)}</strong>{l.quote.valid_until && ` · valid until ${formatDate(l.quote.valid_until)}`}</p>}
                    {l.quote?.reply && <p className="mt-1 whitespace-pre-wrap text-graphite">{l.quote.reply}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <h2 className="text-xl font-bold">My details</h2>
          <div className="mt-4">
            <ProfileForm profile={p} />
          </div>
        </div>
        <div className="card content-start p-5 sm:p-6">
          <h2 className="text-xl font-bold">Password</h2>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </div>
      </section>
    </div>
  );
}
