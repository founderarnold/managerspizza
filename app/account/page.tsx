import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardList, LogOut, ShieldCheck, Tag } from "lucide-react";
import { DashTabs, Notice, NotConfigured, StatusBadge, quoteTotal } from "@/components/Dash";
import { PasswordForm } from "@/components/PasswordForm";
import { requireViewer, ROLE_LABEL } from "@/lib/auth";
import { updateMyProfile } from "@/lib/actions";
import { branchName, BRANCHES } from "@/lib/branches";
import { formatPeso } from "@/lib/catalog";
import { KIND_LABEL, formatDate, type Lead } from "@/lib/leads";
import { supabaseAdmin } from "@/lib/supabase-server";
import { tierName } from "@/lib/tiers";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; denied?: string }> }) {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const v = await requireViewer("/account");
  const sp = await searchParams;
  const p = v.profile;
  const email = v.user.email ?? "";

  const filters = [`user_id.eq.${v.user.id}`];
  if (email && v.user.email_confirmed_at) filters.push(`email.ilike.${email.replace(/[,()]/g, "")}`);
  const { data } = await db.from("leads").select("*").or(filters.join(",")).order("created_at", { ascending: false }).limit(50);
  const leads = (data ?? []) as Lead[];
  const status = p?.status ?? "pending";

  return (
    <div className="container-x py-8 md:py-12">
      <DashTabs viewer={v} active="account" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">My account</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Hi{p?.full_name ? `, ${p.full_name.split(" ")[0]}` : ""}!</h1>
          <p className="mt-1 text-muted">{email}</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn-ghost"><LogOut size={18} aria-hidden /> Sign out</button>
        </form>
      </div>

      <div className="mt-6 grid gap-3">
        {sp.denied && <Notice kind="error">That page is for Manager&apos;s Pizza staff only.</Notice>}
        {sp.saved && <Notice kind="ok">Your details were saved.</Notice>}
        {sp.error && <Notice kind="error">We couldn&apos;t save that. Please try again.</Notice>}
        {!p && <Notice>We&apos;re finishing your account setup. Your details will appear here shortly.</Notice>}
        {p && status === "pending" && (
          <Notice>
            Your account is waiting for approval. A Manager&apos;s Pizza admin will set your price level and home branch. Until then you see the published price list.
          </Notice>
        )}
        {status === "suspended" && <Notice kind="error">Your account is on hold. Please call a branch.</Notice>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><Tag size={16} aria-hidden /> Price level</p>
          <p className="mt-1 font-display text-xl font-bold">{status === "approved" ? tierName(p?.tier) : "Published price list"}</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-2 text-sm text-muted"><Building2 size={16} aria-hidden /> Home branch</p>
          <p className="mt-1 font-display text-xl font-bold">{branchName(p?.branch_slug)}</p>
        </div>
        <Link href="/account/prices" className="flex flex-col justify-between rounded-2xl bg-ink p-5 text-white transition hover:bg-graphite">
          <p className="text-sm text-white/70">Prices for my account</p>
          <p className="mt-1 inline-flex items-center gap-2 font-display text-xl font-bold">See my price list <ArrowRight size={18} aria-hidden /></p>
        </Link>
      </div>

      {(v.isAdmin || v.staffBranches.length > 0) && (
        <section className="mt-8 card p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} aria-hidden /> Staff access</h2>
          <p className="mt-1 text-sm text-muted">{v.roles.map((r) => `${ROLE_LABEL[r.role] ?? r.role}${r.branch_slug ? ` (${branchName(r.branch_slug)})` : ""}`).join(" · ")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/branch" className="btn-dark">Branch dashboard</Link>
            {v.isAdmin && <Link href="/admin" className="btn-primary">Admin dashboard</Link>}
          </div>
        </section>
      )}

      <section className="mt-10" aria-labelledby="req-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="req-h" className="text-2xl font-bold">My requests</h2>
          <Link href="/quote" className="btn-primary"><ClipboardList size={18} aria-hidden /> New quotation</Link>
        </div>
        {leads.length === 0 ? (
          <p className="card mt-4 p-6 text-center text-muted">No requests yet. Add items from the <Link href="/shop" className="font-medium text-brand-red-deep underline">price list</Link> and send a quotation request.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {leads.map((l) => {
              const total = quoteTotal(l);
              return (
                <li key={l.id} className="card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-bold">{l.reference}</p>
                      <p className="text-sm text-muted">{KIND_LABEL[l.kind] ?? l.kind} · {formatDate(l.created_at)} · {branchName(l.assigned_branch ?? l.branch_slug)}</p>
                    </div>
                    <StatusBadge status={l.status} />
                  </div>
                  {l.items?.length > 0 && (
                    <ul className="mt-3 grid gap-1 text-sm text-graphite">
                      {l.items.map((i, k) => <li key={k}>{i.qty} × {i.name}{i.option ? ` (${i.option})` : ""}</li>)}
                    </ul>
                  )}
                  {l.quote && (total != null || l.quote.message) && (
                    <div className="mt-4 rounded-xl bg-cream p-4 text-sm">
                      <p className="font-semibold">Quotation from the branch</p>
                      {l.quote.product_total != null && <p className="mt-1">Products: <strong>{formatPeso(l.quote.product_total)}</strong></p>}
                      {l.quote.shipping != null && <p>Delivery / shipping: <strong>{formatPeso(l.quote.shipping)}</strong></p>}
                      {total != null && <p className="mt-1 text-base">Total: <strong>{formatPeso(total)}</strong></p>}
                      {l.quote.valid_until && <p className="text-muted">Valid until {formatDate(l.quote.valid_until)}</p>}
                      {l.quote.payment_terms && <p className="mt-1">Payment: {l.quote.payment_terms}</p>}
                      {l.quote.message && <p className="mt-2 whitespace-pre-line">{l.quote.message}</p>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section id="profile" className="card p-6" aria-labelledby="profile-h">
          <h2 id="profile-h" className="text-xl font-bold">My details</h2>
          <form action={updateMyProfile} className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="label sm:col-span-2">Full name<input className="field" name="full_name" defaultValue={p?.full_name ?? ""} autoComplete="name" /></label>
            <label className="label">Mobile number<input className="field" name="mobile" defaultValue={p?.mobile ?? ""} inputMode="tel" autoComplete="tel" /></label>
            <label className="label">Business name<input className="field" name="business_name" defaultValue={p?.business_name ?? ""} /></label>
            <label className="label sm:col-span-2">
              I am a
              <select className="field" name="business_type" defaultValue={p?.business_type ?? "new"}>
                <option value="new">New entrepreneur</option>
                <option value="store">Existing pizza store</option>
                <option value="reseller">Reseller</option>
                <option value="distributor">Distributor</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="label">Province<input className="field" name="province" defaultValue={p?.province ?? ""} /></label>
            <label className="label">City / municipality<input className="field" name="city" defaultValue={p?.city ?? ""} /></label>
            <p className="text-xs text-muted sm:col-span-2">
              Your price level and home branch are set by Manager&apos;s Pizza. Nearest branches: {BRANCHES.length} nationwide, see the <Link href="/branches" className="underline">map</Link>.
            </p>
            <button className="btn-primary justify-self-start">Save my details</button>
          </form>
        </section>
        <section className="card content-start p-6" aria-labelledby="pw-h">
          <h2 id="pw-h" className="text-xl font-bold">Password</h2>
          <p className="mt-1 mb-4 text-sm text-muted">Signed in with an email link? Set a password here so you can sign in faster next time.</p>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
