import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft, MessageSquare, Wallet } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { loadOrder } from "@/lib/orders-db";
import { getAllBranches } from "@/lib/branches-db";
import { formatPeso } from "@/lib/catalog";
import { formatDate } from "@/lib/leads";
import { orderStatus, orderTotals } from "@/lib/orders";
import { OrderStatusBadge, TrackBar } from "@/components/shop/OrderStatusBadge";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { ReorderButton } from "@/components/shop/OrderBits";

export const metadata: Metadata = { title: "Order", robots: { index: false } };
export const dynamic = "force-dynamic";

const PAY_STATUS = { submitted: "Being checked", confirmed: "Confirmed", rejected: "Not accepted" } as const;

export default async function OrderPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { ref } = await params;
  const { paid } = await searchParams;
  const v = await requireViewer(`/orders/${ref}`);
  const data = await loadOrder({ reference: ref });
  if (!data || data.order.user_id !== v.id) notFound();
  const { order, events, payments } = data;
  const branch = (await getAllBranches()).find((b) => b.slug === order.branch_slug);
  const t = orderTotals(order, payments);
  const canPay = order.status !== "cancelled" && t.balance > 0 && t.pending < t.balance;

  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> My orders
      </Link>
      {paid && (
        <p role="status" className="mt-3 flex items-center gap-2 rounded-2xl bg-[#e3f4e8] p-4 text-sm text-success">
          <CheckCircle2 size={18} aria-hidden /> Payment screenshot received. We&apos;ll confirm it and start preparing your order.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-extrabold tracking-wide md:text-3xl">{order.reference}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-muted">Placed {formatDate(order.created_at, true)}</p>

      <section className="card mt-5 p-4 sm:p-5">
        <p className="font-semibold">{orderStatus(order.status).customer}</p>
        <div className="mt-4">
          <TrackBar status={order.status} />
        </div>
      </section>

      <div className="mt-4 flex flex-wrap gap-2">
        {canPay && (
          <Link href={`/orders/${order.reference}/pay`} className="btn-primary">
            <Wallet size={18} aria-hidden /> Pay {formatPeso(t.balance - t.pending)}
          </Link>
        )}
        <Link href={`/messages/new?order=${order.reference}`} className="btn-ghost">
          <MessageSquare size={18} aria-hidden /> Message the branch
        </Link>
        <ReorderButton items={order.items} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <OrderSummary order={order} payments={payments} branchName={branch ? `${branch.city}, ${branch.province}` : "–"} />
        <div className="grid gap-4">
          <section className="card p-4 sm:p-5">
            <h2 className="font-bold">Updates</h2>
            <ol className="mt-3 grid gap-3">
              {[...events].reverse().map((e) => (
                <li key={e.id} className="relative border-l-2 border-line pl-4">
                  <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-brand-red-deep" aria-hidden />
                  <p className="text-xs text-muted">{formatDate(e.created_at, true)}</p>
                  {e.status && <p className="font-semibold">{orderStatus(e.status).label}</p>}
                  {e.note && <p className="text-sm text-graphite">{e.note}</p>}
                </li>
              ))}
            </ol>
          </section>
          {payments.length > 0 && (
            <section className="card p-4 sm:p-5">
              <h2 className="font-bold">Payments</h2>
              <ul className="mt-3 grid gap-2 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3">
                    <span>
                      <span className="font-medium">{p.method.toUpperCase()} · {formatPeso(Number(p.amount))}</span>
                      <span className="block text-xs text-muted">{formatDate(p.created_at, true)}{p.reference ? ` · Ref ${p.reference}` : ""}</span>
                      {p.review_note && <span className="block text-xs text-brand-red-deep">{p.review_note}</span>}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "confirmed" ? "bg-[#e3f4e8] text-success" : p.status === "rejected" ? "bg-[#fff1f1] text-brand-red-deep" : "bg-[#e8f0ff] text-[#1d3f8a]"}`}>
                      {PAY_STATUS[p.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
