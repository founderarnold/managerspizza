"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Bus, Car, Container, Package, ShieldCheck, Store, Truck } from "lucide-react";
import { placeOrder } from "@/app/actions/shop";
import type { FormState } from "@/app/actions/auth";
import { DELIVERY_METHODS } from "@/lib/orders";
import { formatPeso } from "@/lib/catalog";
import { FormMessage, SubmitButton } from "@/components/dashboard/ui";
import { useShop } from "./ShopProvider";
import { useCartLines } from "./CartView";

const ICON: Record<string, typeof Truck> = {
  pickup: Store,
  lalamove: Car,
  grab: Car,
  transportify: Truck,
  trucking: Truck,
  container: Container,
  bus: Bus,
  van: Package,
  jeep: Bus,
};

export function CheckoutForm({ branches, defaults }: { branches: { slug: string; label: string }[]; defaults: { branch: string; name: string; mobile: string; address: string } }) {
  const [state, action] = useActionState<FormState, FormData>(placeOrder, null);
  const { cart, cartReady } = useShop();
  const { lines, subtotal } = useCartLines();
  const [delivery, setDelivery] = useState("pickup");

  if (!cartReady) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-sand" aria-hidden />;
  if (lines.length === 0)
    return (
      <p className="card mt-6 p-6">
        Your cart is empty. <Link href="/shop" className="font-semibold text-brand-red-deep underline">Shop supplies</Link>
      </p>
    );

  return (
    <form action={action} className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <input type="hidden" name="cart" value={JSON.stringify(cart)} />
      <div className="grid gap-6">
        <section className="card p-5">
          <h2 className="text-lg font-bold">1. Branch</h2>
          <label className="label mt-3 block">
            Branch that will serve your order
            <select className="field" name="branch" defaultValue={defaults.branch} required>
              <option value="" disabled>Choose a branch</option>
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>{b.label}</option>
              ))}
            </select>
          </label>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-bold">2. Pickup or delivery</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method">
            {DELIVERY_METHODS.map((d) => {
              const Icon = ICON[d.id] ?? Truck;
              return (
                <label key={d.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${delivery === d.id ? "border-ink bg-sand" : "border-line bg-white hover:border-ink/40"}`}>
                  <input type="radio" name="delivery" value={d.id} checked={delivery === d.id} onChange={() => setDelivery(d.id)} className="mt-1 h-4 w-4 accent-[#B80000]" />
                  <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-semibold">{d.label}</span>
                    <span className="block text-xs text-muted">{d.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
          {delivery !== "pickup" && (
            <label className="label mt-4 block">
              Complete delivery address *
              <textarea className="field min-h-20" name="address" required defaultValue={defaults.address} placeholder="House/unit, street, barangay, city, province. For bus or container: the terminal or port." />
            </label>
          )}
          <p className="mt-3 text-xs text-muted">
            {delivery === "pickup" ? "No shipping fee." : "Shipping is paid by the buyer. For Lalamove, Grab and Transportify you usually pay the rider; for trucking, container, bus, van and jeep the branch adds the fee to your order."}
          </p>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-bold">3. Receiver</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="label">
              Name *
              <input className="field" name="name" required defaultValue={defaults.name} autoComplete="name" />
            </label>
            <label className="label">
              Mobile number *
              <input className="field" name="mobile" required defaultValue={defaults.mobile} inputMode="tel" autoComplete="tel" />
            </label>
            <label className="label sm:col-span-2">
              Notes for the branch
              <textarea className="field min-h-16" name="notes" placeholder="Preferred pickup or delivery date, landmarks…" />
            </label>
          </div>
        </section>
      </div>

      <aside className="card grid gap-3 p-5 lg:sticky lg:top-28">
        <h2 className="text-lg font-bold">Order summary</h2>
        <ul className="grid gap-2 text-sm">
          {lines.map((l) => (
            <li key={`${l.sheet}|${l.row}|${l.column}`} className="flex justify-between gap-3">
              <span className="min-w-0">
                <span className="font-medium">{l.qty} × {l.product.name}</span>
                <span className="block text-xs text-muted">{l.variant.label}</span>
              </span>
              <span className="shrink-0 tabular-nums">{l.total != null ? formatPeso(l.total) : "–"}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-line pt-3">
          <span className="font-semibold">Items subtotal</span>
          <strong className="font-display text-2xl tabular-nums">{formatPeso(subtotal)}</strong>
        </div>
        <p className="text-xs text-muted">Next, you&apos;ll see the QR codes to pay by GCash, BDO, Maya or GoTyme and upload your payment screenshot.</p>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full text-base">Place order and pay</SubmitButton>
        <p className="flex items-center gap-1.5 text-xs text-muted"><ShieldCheck size={14} aria-hidden /> Your order is processed only after your payment is confirmed.</p>
      </aside>
    </form>
  );
}
