import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, PartyPopper } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { loadOrder, paymentMethods } from "@/lib/orders-db";
import { formatPeso } from "@/lib/catalog";
import { orderTotals } from "@/lib/orders";
import { PaymentPanel } from "@/components/shop/PaymentPanel";
import { ClearCartOnce } from "@/components/shop/OrderBits";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Pay for your order", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PayPage({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ new?: string }> }) {
  const { ref } = await params;
  const { new: isNew } = await searchParams;
  const v = await requireViewer(`/orders/${ref}/pay`);
  const data = await loadOrder({ reference: ref });
  if (!data || data.order.user_id !== v.id) notFound();
  const { order, payments } = data;
  const t = orderTotals(order, payments);
  const due = Math.max(0, t.balance - t.pending);
  const methods = await paymentMethods();

  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      {isNew && <ClearCartOnce />}
      <Link href={`/orders/${order.reference}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Order {order.reference}
      </Link>
      {isNew && (
        <p role="status" className="mt-3 flex items-center gap-2 rounded-2xl bg-[#e3f4e8] p-4 text-sm text-success">
          <PartyPopper size={18} aria-hidden /> Order {order.reference} placed! Pay now to get it prepared.
        </p>
      )}
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Pay for your order</h1>
      <div className="card mt-4 flex flex-wrap items-end justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="text-sm text-muted">Amount to pay</p>
          <p className="font-display text-3xl font-extrabold tabular-nums">{formatPeso(due)}</p>
        </div>
        <p className="max-w-md text-xs text-muted">
          {order.shipping_fee == null
            ? "This is for your items. The branch will add the shipping fee to your order, and you can pay it here too once it appears."
            : "Includes everything on your order so far."}
        </p>
      </div>

      {due <= 0 ? (
        <p className="card mt-4 p-5">
          Nothing to pay right now. <Link href={`/orders/${order.reference}`} className="font-semibold text-brand-red-deep underline">See your order</Link>
        </p>
      ) : methods.length === 0 ? (
        <p className="card mt-4 p-5">Payment details are being set up. Please call or SMS {SITE.phones[0]} to pay for order {order.reference}.</p>
      ) : (
        <PaymentPanel orderId={order.id} reference={order.reference} amount={due} methods={methods} />
      )}
    </div>
  );
}
