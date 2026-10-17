"use client";

import { useActionState, useState } from "react";
import { savePaymentMethod } from "@/app/actions/shop";
import type { FormState } from "@/app/actions/auth";
import type { PaymentMethod } from "@/lib/orders";
import { FormMessage, SubmitButton } from "@/components/dashboard/ui";

export function PaymentMethodForm({ method }: { method: PaymentMethod & { qrUrl: string | null } }) {
  const [state, action] = useActionState<FormState, FormData>(savePaymentMethod.bind(null, method.id), null);
  const [preview, setPreview] = useState<string | null>(method.qrUrl);
  return (
    <form action={action} className="card grid gap-4 p-5 sm:grid-cols-[180px_1fr]">
      <div className="grid content-start justify-items-center gap-2">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`${method.label} QR code`} className="aspect-square w-full max-w-[180px] rounded-xl border border-line bg-white object-contain p-1" />
        ) : (
          <div className="grid aspect-square w-full max-w-[180px] place-items-center rounded-xl border-2 border-dashed border-line text-center text-xs text-muted">No QR yet</div>
        )}
        <label className="btn-ghost !min-h-10 cursor-pointer !py-2 text-sm">
          Upload QR image
          <input type="file" name="qr" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
        </label>
      </div>
      <div className="grid content-start gap-3">
        <h3 className="text-lg font-bold">{method.label}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="label">
            Account name
            <input className="field" name="accountName" defaultValue={method.account_name ?? ""} placeholder="e.g. Manager's Pizza Depot" />
          </label>
          <label className="label">
            Account / mobile number
            <input className="field" name="accountNumber" defaultValue={method.account_number ?? ""} />
          </label>
        </div>
        <label className="label">
          Instructions for the customer <span className="font-normal text-muted">(optional)</span>
          <input className="field" name="instructions" defaultValue={method.instructions ?? ""} placeholder="e.g. Use InstaPay; put your order number in the notes" />
        </label>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={method.active} className="h-5 w-5 accent-[#B80000]" /> Show at checkout
        </label>
        <FormMessage state={state} />
        <div>
          <SubmitButton>Save {method.label}</SubmitButton>
        </div>
      </div>
    </form>
  );
}
