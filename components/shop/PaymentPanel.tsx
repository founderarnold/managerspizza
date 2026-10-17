"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Copy, Download, ImagePlus, Loader2, Upload } from "lucide-react";
import { submitPayment } from "@/app/actions/shop";
import type { FormState } from "@/app/actions/auth";
import type { PaymentMethod } from "@/lib/orders";
import { formatPeso } from "@/lib/catalog";
import { FormMessage } from "@/components/dashboard/ui";

type Method = PaymentMethod & { qrUrl: string | null };

/** Shrinks a phone screenshot to at most 1600 px (JPEG) so it uploads fast on mobile data. */
async function compress(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.size < 400 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export function PaymentPanel({ orderId, reference, amount, methods }: { orderId: string; reference: string; amount: number; methods: Method[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(submitPayment.bind(null, orderId), null);
  const [pending, startTransition] = useTransition();
  const [mi, setMi] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const m = methods[mi];

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start">
      <section className="card p-4 sm:p-5">
        <h2 className="font-bold">1. Choose how to pay</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist">
          {methods.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={i === mi}
              onClick={() => setMi(i)}
              className={`min-h-12 rounded-xl border px-3 font-semibold ${i === mi ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid justify-items-center gap-3 rounded-2xl bg-sand p-4 text-center">
          {m.qrUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.qrUrl} alt={`${m.label} QR code for Manager's Pizza`} className="w-full max-w-[280px] rounded-xl bg-white p-2" />
              <a href={m.qrUrl} download={`managers-pizza-${m.id}-qr`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red-deep">
                <Download size={15} aria-hidden /> Save QR code to your phone
              </a>
            </>
          ) : (
            <p className="py-6 text-sm text-muted">QR code coming soon. Use the account details below.</p>
          )}
          {(m.account_name || m.account_number) && (
            <div className="w-full rounded-xl bg-white p-3 text-left text-sm">
              {m.account_name && <p><span className="text-muted">Account name:</span> <strong>{m.account_name}</strong></p>}
              {m.account_number && (
                <p className="mt-1 flex items-center justify-between gap-2">
                  <span><span className="text-muted">Number:</span> <strong className="tabular-nums">{m.account_number}</strong></span>
                  <button type="button" onClick={() => copy(m.account_number!)} className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs font-semibold">
                    <Copy size={12} aria-hidden /> {copied === m.account_number ? "Copied" : "Copy"}
                  </button>
                </p>
              )}
            </div>
          )}
          <p className="flex flex-wrap items-center justify-center gap-2 text-sm">
            Pay exactly <strong className="tabular-nums">{formatPeso(amount)}</strong>
            <button type="button" onClick={() => copy(String(amount))} className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold">
              <Copy size={12} aria-hidden /> {copied === String(amount) ? "Copied" : "Copy amount"}
            </button>
          </p>
          <p className="text-xs text-muted">{m.instructions || `Open your ${m.label} app, scan or upload the QR code, and put ${reference} in the message or notes.`}</p>
        </div>
      </section>

      <section className="card p-4 sm:p-5">
        <h2 className="font-bold">2. Upload your payment screenshot</h2>
        <form
          className="mt-3 grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const f = fd.get("proof");
            if (f instanceof File && f.size > 0) fd.set("proof", await compress(f), "proof.jpg");
            startTransition(() => formAction(fd));
          }}
        >
          <input type="hidden" name="method" value={m.id} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid min-h-40 place-items-center rounded-2xl border-2 border-dashed border-line bg-white p-3 text-center hover:border-ink/40"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Your payment screenshot" className="max-h-72 rounded-lg" />
            ) : (
              <span className="grid justify-items-center gap-2 text-muted">
                <ImagePlus size={32} aria-hidden />
                <span className="font-semibold text-ink">Tap to choose your screenshot</span>
                <span className="text-xs">From your gallery or take a photo</span>
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            name="proof"
            accept="image/*"
            required
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setPreview(f ? URL.createObjectURL(f) : null);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label">
              Amount paid ({m.label})
              <input className="field tabular-nums" name="amount" inputMode="decimal" defaultValue={amount} required />
            </label>
            <label className="label">
              Reference no. <span className="font-normal text-muted">(optional)</span>
              <input className="field" name="reference" placeholder="From your receipt" />
            </label>
          </div>
          <FormMessage state={state} />
          <button type="submit" className="btn-primary w-full text-base" disabled={pending}>
            {pending ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Upload size={18} aria-hidden />}
            Submit payment
          </button>
          <p className="text-xs text-muted">We check your payment and confirm it before the branch prepares your order. You&apos;ll see the update on your order page.</p>
        </form>
      </section>
    </div>
  );
}
