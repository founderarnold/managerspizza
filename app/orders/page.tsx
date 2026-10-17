import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatPeso } from "@/lib/catalog";
import { formatDate } from "@/lib/leads";
import { orderStatus, type Order } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";
import { ReorderButton } from "@/components/shop/OrderBits";

export const metadata: Metadata = { title: "My orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const v = await requireViewer("/orders");
  const { data } = await supabaseAdmin()!.from("orders").select("*").eq("user_id", v.id).order("created_at", { ascending: false }).limit(100);
  const orders = (data ?? []) as Order[];
  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">My orders</h1>
      {orders.length === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <Package size={40} className="mx-auto text-muted" aria-hidden />
          <p className="mt-3 text-lg font-semibold">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-5">Shop supplies</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((o) => (
            <li key={o.id} className="card p-4">
              <Link href={`/orders/${o.reference}`} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <strong className="font-display tracking-wide">{o.reference}</strong>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(o.created_at)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} · {formatPeso(Number(o.subtotal) + Number(o.adjustment) + Number(o.shipping_fee ?? 0))}
                  </p>
                  <p className="mt-1 text-sm">{orderStatus(o.status).customer}</p>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-muted" aria-hidden />
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                {o.status === "pending_payment" && <Link href={`/orders/${o.reference}/pay`} className="btn-primary !min-h-10 !py-2 text-sm">Pay now</Link>}
                <ReorderButton items={o.items} className="btn-ghost !min-h-10 !py-2 text-sm" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
