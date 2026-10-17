import { formatPeso } from "@/lib/catalog";
import { deliveryLabel, orderTotals, type Order, type Payment } from "@/lib/orders";

/** Items, totals and delivery details, shared by the customer and staff order pages. */
export function OrderSummary({ order, payments, branchName }: { order: Order; payments: Payment[]; branchName: string }) {
  const t = orderTotals(order, payments);
  return (
    <div className="grid gap-4">
      <section className="card p-4 sm:p-5">
        <h2 className="font-bold">Items</h2>
        <ul className="mt-3 divide-y divide-line">
          {order.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className="font-medium">{i.name}</span>
                <span className="block text-xs text-muted">{i.option} · {i.qty} × {formatPeso(Number(i.unit_price))}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatPeso(Number(i.line_total))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 grid gap-1.5 border-t border-line pt-3 text-sm">
          <Row k="Items subtotal" v={formatPeso(Number(order.subtotal))} />
          {Number(order.adjustment) !== 0 && <Row k={`Adjustment${order.adjustment_note ? ` (${order.adjustment_note})` : ""}`} v={formatPeso(Number(order.adjustment))} />}
          <Row
            k="Shipping"
            v={order.shipping_fee == null ? "To be quoted by the branch" : Number(order.shipping_fee) === 0 ? (order.delivery_method === "pickup" ? "Pickup, free" : "Paid to the rider / courier") : formatPeso(Number(order.shipping_fee))}
          />
          <div className="flex items-center justify-between pt-1">
            <dt className="font-bold">Total</dt>
            <dd className="font-display text-2xl font-extrabold tabular-nums">{formatPeso(t.total)}</dd>
          </div>
          {t.paid > 0 && <Row k="Paid (confirmed)" v={formatPeso(t.paid)} />}
          {t.pending > 0 && <Row k="Being checked" v={formatPeso(t.pending)} />}
          {t.paid > 0 && <Row k="Balance" v={formatPeso(t.balance)} strong />}
        </dl>
      </section>
      <section className="card p-4 sm:p-5">
        <h2 className="font-bold">Delivery</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Row k="Branch" v={branchName} stack />
          <Row k="Method" v={deliveryLabel(order.delivery_method)} stack />
          <Row k="Receiver" v={`${order.contact_name} · ${order.contact_mobile}`} stack />
          {order.delivery_address && <Row k="Address" v={order.delivery_address} stack />}
          {order.courier && <Row k="Courier" v={order.courier} stack />}
          {order.tracking_ref && <Row k="Tracking / booking no." v={order.tracking_ref} stack />}
          {order.notes && <Row k="Notes" v={order.notes} stack />}
        </dl>
        {order.tracking_url && (
          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="btn-dark mt-4">
            Track the delivery live
          </a>
        )}
      </section>
    </div>
  );
}

function Row({ k, v, strong = false, stack = false }: { k: string; v: string; strong?: boolean; stack?: boolean }) {
  if (stack)
    return (
      <div>
        <dt className="text-muted">{k}</dt>
        <dd className="font-medium">{v}</dd>
      </div>
    );
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className={`tabular-nums ${strong ? "font-bold" : ""}`}>{v}</dd>
    </div>
  );
}
