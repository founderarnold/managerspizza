"use client";

import { useActionState } from "react";
import { reviewPayment, updateOrder } from "@/app/actions/shop";
import type { FormState } from "@/app/actions/auth";
import { ORDER_STATUSES, type Order } from "@/lib/orders";
import { FormMessage, SubmitButton } from "@/components/dashboard/ui";

export function OrderUpdateForm({ order }: { order: Order }) {
  const [state, action] = useActionState<FormState, FormData>(updateOrder.bind(null, order.id), null);
  return (
    <form action={action} className="grid gap-4">
      <label className="label">
        Status
        <select className="field" name="status" defaultValue={order.status}>
          {ORDER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="label">
        Note to the customer <span className="font-normal text-muted">(shown on their order page)</span>
        <textarea className="field min-h-16" name="note" placeholder="e.g. Booked on Lalamove, rider arriving 3 PM" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">
          Shipping fee (PHP)
          <input className="field" name="shippingFee" inputMode="decimal" defaultValue={order.shipping_fee ?? ""} placeholder="0 if paid to rider" />
        </label>
        <label className="label">
          Adjustment (PHP)
          <input className="field" name="adjustment" inputMode="decimal" defaultValue={Number(order.adjustment) || ""} placeholder="e.g. 750 or -200" />
        </label>
        <label className="label sm:col-span-2">
          Reason for the adjustment
          <input className="field" name="adjustmentNote" defaultValue={order.adjustment_note ?? ""} placeholder="e.g. Below minimum order: +₱5/pc." />
        </label>
        <label className="label">
          Courier / carrier
          <input className="field" name="courier" defaultValue={order.courier ?? ""} placeholder="Lalamove, Victory Liner, 2GO…" />
        </label>
        <label className="label">
          Tracking / booking no.
          <input className="field" name="trackingRef" defaultValue={order.tracking_ref ?? ""} />
        </label>
        <label className="label sm:col-span-2">
          Live tracking link
          <input className="field" name="trackingUrl" type="url" defaultValue={order.tracking_url ?? ""} placeholder="https://…" />
        </label>
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Save update</SubmitButton>
      </div>
    </form>
  );
}

export function PaymentReview({ paymentId }: { paymentId: string }) {
  const [okState, confirm] = useActionState<FormState, FormData>(reviewPayment.bind(null, paymentId, "confirmed"), null);
  const [noState, reject] = useActionState<FormState, FormData>(reviewPayment.bind(null, paymentId, "rejected"), null);
  return (
    <div className="grid gap-2">
      <form action={confirm}>
        <SubmitButton className="btn !min-h-10 w-full bg-success py-2 text-sm text-white hover:opacity-90">Confirm payment received</SubmitButton>
      </form>
      <form action={reject} className="flex gap-2">
        <input className="field !mt-0 flex-1 text-sm" name="note" placeholder="Reason if not received" />
        <SubmitButton className="btn-ghost !min-h-10 !py-2 text-sm">Not received</SubmitButton>
      </form>
      <FormMessage state={okState ?? noState} />
    </div>
  );
}
