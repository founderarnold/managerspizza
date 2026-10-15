"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPeso } from "@/lib/catalog";
import { PRICE_NOTE } from "@/lib/site";
import { useQuote } from "./QuoteProvider";
import { LeadForm } from "./LeadForm";
import { ConsentFields, ContactFields } from "./ContactFields";

export function QuoteBuilder() {
  const { items, setQty, remove, clear } = useQuote();
  const total = items.reduce((s, i) => s + (i.unitPrice ?? 0) * i.qty, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_440px]">
      <section aria-labelledby="items-h">
        <h2 id="items-h" className="text-xl font-bold">Items ({items.length})</h2>
        {items.length === 0 ? (
          <div className="card mt-4 p-8 text-center">
            <ShoppingBag size={36} className="mx-auto text-muted" aria-hidden />
            <p className="mt-3 font-medium">Your quote list is empty.</p>
            <p className="mt-1 text-sm text-muted">Add items from the price list, or just describe what you need in the notes.</p>
            <Link href="/shop" className="btn-primary mt-5">Browse the price list</Link>
          </div>
        ) : (
          <>
            <ul className="mt-4 grid gap-3">
              {items.map((i) => (
                <li key={i.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-sm text-muted">{i.option}{i.unitPrice != null && ` · ${formatPeso(i.unitPrice)} each`}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-full border border-line">
                      <button type="button" className="inline-flex h-10 w-10 items-center justify-center" aria-label={`Decrease ${i.name}`} onClick={() => setQty(i.id, i.qty - 1)}><Minus size={16} /></button>
                      <input
                        aria-label={`Quantity of ${i.name}`}
                        className="w-16 bg-transparent text-center tabular-nums focus:outline-none"
                        inputMode="numeric"
                        value={i.qty}
                        onChange={(e) => setQty(i.id, Number(e.target.value))}
                      />
                      <button type="button" className="inline-flex h-10 w-10 items-center justify-center" aria-label={`Increase ${i.name}`} onClick={() => setQty(i.id, i.qty + 1)}><Plus size={16} /></button>
                    </div>
                    <p className="w-24 text-right font-semibold tabular-nums">{i.unitPrice != null ? formatPeso(i.unitPrice * i.qty) : "–"}</p>
                    <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-brand-red-deep" aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink p-5 text-white">
              <span>Estimated items subtotal</span>
              <strong className="font-display text-2xl tabular-nums">{formatPeso(total)}</strong>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Estimate only, before minimum-order adjustments and shipping. {PRICE_NOTE}
            </p>
          </>
        )}
      </section>

      <section aria-labelledby="send-h" className="card p-5 sm:p-6">
        <h2 id="send-h" className="text-xl font-bold">Send for quotation</h2>
        <div className="mt-5">
          <LeadForm
            kind="quote"
            submitLabel="Submit quotation request"
            onDone={clear}
            extra={() => ({
              items: items.map((i) => ({ sheet: i.sheet, name: i.name, option: i.option, unitPrice: i.unitPrice, qty: i.qty })),
              summary: items.map((i) => `${i.qty} × ${i.name} (${i.option})`).join("\n"),
            })}
          >
            <ContactFields />
            <label className="label">
              Full delivery address (optional)
              <input className="field" name="address" autoComplete="street-address" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label">
                I am a
                <select className="field" name="businessType" defaultValue="new">
                  <option value="new">New entrepreneur</option>
                  <option value="store">Existing pizza store</option>
                  <option value="reseller">Reseller</option>
                  <option value="distributor">Distributor</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="label">
                Preferred fulfillment
                <select className="field" name="fulfillment" defaultValue="pickup">
                  <option value="pickup">Pickup at branch</option>
                  <option value="local">Local delivery</option>
                  <option value="courier">Courier</option>
                  <option value="bus">Bus cargo</option>
                  <option value="air">Air cargo</option>
                  <option value="truck">Truck</option>
                </select>
              </label>
            </div>
            <label className="label">
              Notes
              <textarea className="field min-h-24" name="notes" placeholder="Anything else we should know, e.g. delivery date or items not on the list" />
            </label>
            <ConsentFields />
          </LeadForm>
        </div>
      </section>
    </div>
  );
}
