import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, MessageSquare, Phone } from "lucide-react";
import { Notice, NotConfigured, StatusBadge } from "@/components/Dash";
import { canManageLead, requireViewer } from "@/lib/auth";
import { updateLead } from "@/lib/actions";
import { BRANCHES, branchName } from "@/lib/branches";
import { formatPeso } from "@/lib/catalog";
import { KIND_LABEL, LEAD_STATUSES, STATUS_LABEL, formatDateTime, type Lead } from "@/lib/leads";
import { supabaseAdmin } from "@/lib/supabase-server";

export const metadata: Metadata = { title: "Request", robots: { index: false } };
export const dynamic = "force-dynamic";

const telLink = (m: string) => m.replace(/[^\d+]/g, "");

export default async function LeadPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const db = supabaseAdmin();
  if (!db) return <NotConfigured />;
  const { id } = await params;
  const v = await requireViewer(`/leads/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const lead = data as Lead;
  if (!canManageLead(v, lead)) redirect("/account?denied=lead");
  const sp = await searchParams;
  const back = v.isAdmin ? "/admin/leads" : `/branch?b=${lead.assigned_branch ?? lead.branch_slug}`;
  const listTotal = lead.items?.reduce((s, i) => s + (i.unitPrice ?? 0) * (i.qty ?? 0), 0) ?? 0;
  const details = Object.entries(lead.details ?? {}).filter(([k, val]) => k !== "items" && k !== "summary" && val !== "" && val != null);
  const q = lead.quote ?? {};

  return (
    <div className="container-x py-8 md:py-12">
      <Link href={back} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Back to requests
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold md:text-4xl">{lead.reference}</h1>
        <StatusBadge status={lead.status} />
      </div>
      <p className="mt-1 text-muted">{KIND_LABEL[lead.kind] ?? lead.kind} · received {formatDateTime(lead.created_at)}</p>
      <div className="mt-4 grid gap-2">
        {sp.saved && <Notice kind="ok">Saved. The customer sees the update on their account if they have one.</Notice>}
        {sp.error && <Notice kind="error">We couldn&apos;t save that. Please try again.</Notice>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="grid content-start gap-6">
          <section className="card p-6">
            <h2 className="text-lg font-bold">Customer</h2>
            <p className="mt-2 text-xl font-semibold">{lead.name}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={`tel:${telLink(lead.mobile)}`} className="btn-dark"><Phone size={17} aria-hidden /> Call {lead.mobile}</a>
              <a href={`sms:${telLink(lead.mobile)}`} className="btn-ghost"><MessageSquare size={17} aria-hidden /> Text</a>
              {lead.email && <a href={`mailto:${lead.email}?subject=${encodeURIComponent(`Manager's Pizza ${lead.reference}`)}`} className="btn-ghost">Email</a>}
            </div>
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {[
                ["Location", [lead.barangay, lead.city, lead.province].filter(Boolean).join(", ")],
                ["Address", lead.address],
                ["Business", lead.business_type],
                ["Fulfillment", lead.fulfillment],
                ["Branch picked", lead.branch_slug ? branchName(lead.branch_slug) : "Let Manager's Pizza choose"],
                ["Handled by", branchName(lead.assigned_branch)],
                ["Has an account", lead.user_id ? "Yes" : "No"],
              ].filter(([, val]) => val).map(([k, val]) => (
                <div key={k}><dt className="text-muted">{k}</dt><dd className="font-medium">{val}</dd></div>
              ))}
            </dl>
            {lead.notes && <p className="mt-4 whitespace-pre-line rounded-xl bg-cream p-4 text-sm">{lead.notes}</p>}
          </section>

          {lead.items?.length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold">Items</h2>
              <ul className="mt-3 divide-y divide-line text-sm">
                {lead.items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-3 py-2">
                    <span>{i.qty} × {i.name}{i.option ? ` (${i.option})` : ""}</span>
                    <span className="tabular-nums text-muted">{i.unitPrice != null ? formatPeso(i.unitPrice * (i.qty ?? 0)) : "–"}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-sm">Price-list estimate: <strong className="tabular-nums">{formatPeso(listTotal)}</strong></p>
            </section>
          )}

          {details.length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold">Other details</h2>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {details.map(([k, val]) => (
                  <div key={k}><dt className="text-muted capitalize">{k.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</dt><dd className="font-medium">{String(val)}</dd></div>
                ))}
              </dl>
            </section>
          )}
        </div>

        <section className="card content-start p-6" aria-labelledby="upd-h">
          <h2 id="upd-h" className="text-lg font-bold">Update this request</h2>
          <form action={updateLead} className="mt-4 grid gap-4">
            <input type="hidden" name="id" value={lead.id} />
            <label className="label">
              Status
              <select className="field" name="status" defaultValue={lead.status}>
                {LEAD_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </label>
            {v.isAdmin && (
              <label className="label">
                Branch handling it
                <select className="field" name="assigned_branch" defaultValue={lead.assigned_branch ?? ""}>
                  <option value="">Not assigned</option>
                  {BRANCHES.map((b) => <option key={b.slug} value={b.slug}>{b.city}, {b.province}</option>)}
                </select>
              </label>
            )}
            <fieldset className="grid gap-3 rounded-xl bg-sand p-4">
              <legend className="px-1 text-sm font-bold">Quotation for the customer</legend>
              <div className="grid grid-cols-2 gap-3">
                <label className="label">Products (₱)<input className="field" name="product_total" inputMode="decimal" defaultValue={q.product_total ?? (listTotal || "")} /></label>
                <label className="label">Shipping (₱)<input className="field" name="shipping" inputMode="decimal" defaultValue={q.shipping ?? ""} /></label>
              </div>
              <label className="label">Valid until<input className="field" type="date" name="valid_until" defaultValue={q.valid_until ?? ""} /></label>
              <label className="label">Payment terms<input className="field" name="payment_terms" defaultValue={q.payment_terms ?? ""} placeholder="e.g. 50% down, balance on pickup" /></label>
              <label className="label">Message to the customer<textarea className="field min-h-24" name="message" defaultValue={q.message ?? ""} /></label>
            </fieldset>
            <button className="btn-primary">Save</button>
            {q.updated_at && <p className="text-xs text-muted">Last updated by {q.updated_by ?? "staff"}, {formatDateTime(q.updated_at)}</p>}
          </form>
        </section>
      </div>
    </div>
  );
}
