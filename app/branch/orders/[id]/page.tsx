import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare, Phone } from "lucide-react";
import { canSeeBranch, requireStaff } from "@/lib/auth";
import { loadOrder, proofLinks } from "@/lib/orders-db";
import { getAllBranches } from "@/lib/branches-db";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatPeso } from "@/lib/catalog";
import { formatDate } from "@/lib/leads";
import { TIERS } from "@/lib/tiers";
import { orderStatus } from "@/lib/orders";
import { OrderStatusBadge, TrackBar } from "@/components/shop/OrderStatusBadge";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { OrderUpdateForm, PaymentReview } from "@/components/shop/StaffOrderForms";

export const metadata: Metadata = { title: "Order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function StaffOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await requireStaff(`/branch/orders/${id}`);
  const data = await loadOrder({ id });
  if (!data || !canSeeBranch(v, data.order.branch_slug)) notFound();
  const { order, events, payments } = data;
  const db = supabaseAdmin()!;
  const [branches, links, { data: customer }, { data: convo }] = await Promise.all([
    getAllBranches(),
    proofLinks(payments),
    db.from("profiles").select("full_name,business_name,email,mobile,tier").eq("id", order.user_id).maybeSingle(),
    db.from("conversations").select("id").eq("order_id", order.id).order("created_at").limit(1).maybeSingle(),
  ]);
  const branch = branches.find((b) => b.slug === order.branch_slug);
  const tel = order.contact_mobile.replace(/\s+/g, "");

  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <Link href={`/branch/orders?b=${order.branch_slug ?? "all"}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Orders
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-wide md:text-3xl">{order.reference}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-muted">
        Placed {formatDate(order.created_at, true)} · {customer?.full_name}
        {customer?.business_name ? ` · ${customer.business_name}` : ""} · {TIERS.find((t) => t.id === order.tier)?.name} price
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`tel:${tel}`} className="btn-ghost !min-h-10 !py-2 text-sm"><Phone size={16} aria-hidden /> Call receiver</a>
        <a href={`sms:${tel}?body=${encodeURIComponent(`Manager's Pizza: update on your order ${order.reference}`)}`} className="btn-ghost !min-h-10 !py-2 text-sm">SMS</a>
        {convo && <Link href={`/messages/${convo.id}`} className="btn-ghost !min-h-10 !py-2 text-sm"><MessageSquare size={16} aria-hidden /> Chat</Link>}
      </div>

      <section className="card mt-4 p-4 sm:p-5">
        <TrackBar status={order.status} />
      </section>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="grid gap-4">
          <section className="card p-4 sm:p-5">
            <h2 className="font-bold">Payments</h2>
            {payments.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No payment uploaded yet.</p>
            ) : (
              <ul className="mt-3 grid gap-4">
                {payments.map((p) => (
                  <li key={p.id} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[160px_1fr]">
                    {links[p.id] ? (
                      <a href={links[p.id]} target="_blank" rel="noopener noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={links[p.id]} alt={`Payment screenshot ${p.method}`} className="max-h-56 w-full rounded-lg bg-sand object-contain" />
                        <span className="mt-1 block text-center text-xs font-semibold text-brand-red-deep">Open full size</span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted">Screenshot not available</span>
                    )}
                    <div className="text-sm">
                      <p className="font-semibold">{p.method.toUpperCase()} · {formatPeso(Number(p.amount))}</p>
                      <p className="text-muted">{formatDate(p.created_at, true)}{p.reference ? ` · Ref ${p.reference}` : ""}</p>
                      <p className="mt-1">
                        Status: <strong>{p.status === "submitted" ? "Waiting for check" : p.status === "confirmed" ? "Confirmed" : "Not accepted"}</strong>
                        {p.review_note ? ` · ${p.review_note}` : ""}
                      </p>
                      {p.status === "submitted" && (
                        <div className="mt-3">
                          <PaymentReview paymentId={p.id} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <OrderSummary order={order} payments={payments} branchName={branch ? `${branch.city}, ${branch.province}` : "–"} />
        </div>
        <div className="grid gap-4">
          <section className="card p-4 sm:p-5">
            <h2 className="font-bold">Update the order</h2>
            <div className="mt-3">
              <OrderUpdateForm order={order} />
            </div>
          </section>
          <section className="card p-4 sm:p-5">
            <h2 className="font-bold">Timeline</h2>
            <ol className="mt-3 grid gap-3">
              {[...events].reverse().map((e) => (
                <li key={e.id} className="border-l-2 border-line pl-3 text-sm">
                  <p className="text-xs text-muted">{formatDate(e.created_at, true)}</p>
                  {e.status && <p className="font-semibold">{orderStatus(e.status).label}</p>}
                  {e.note && <p className="text-graphite">{e.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
