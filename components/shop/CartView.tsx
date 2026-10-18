"use client";

import Link from "next/link";
import { ArrowRight, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { formatPeso } from "@/lib/catalog";
import { findVariant } from "@/lib/products";
import { useShop } from "./ShopProvider";
import { ProductTile, QtyStepper } from "./ProductCard";

export function useCartLines() {
  const { cart, priceOf } = useShop();
  const lines = cart
    .map((l) => {
      const found = findVariant(l.sheet, l.row, l.column);
      if (!found) return null;
      const price = priceOf(l.sheet, l.row, l.column);
      return { ...l, ...found, price, total: price != null ? price * l.qty : null };
    })
    .filter((x): x is NonNullable<typeof x> => !!x && !x.product.rfq);
  const subtotal = lines.reduce((s, l) => s + (l.total ?? 0), 0);
  return { lines, subtotal, missing: lines.some((l) => l.price == null) };
}

export function CartView() {
  const { me, cartReady, setCartQty, removeFromCart, clearCart } = useShop();
  const { lines, subtotal, missing } = useCartLines();

  if (!cartReady) return <div className="mt-6 h-40 animate-pulse rounded-2xl bg-sand" aria-hidden />;

  if (lines.length === 0)
    return (
      <div className="card mt-6 p-8 text-center">
        <ShoppingBag size={40} className="mx-auto text-muted" aria-hidden />
        <p className="mt-3 text-lg font-semibold">Your cart is empty.</p>
        <p className="mt-1 text-sm text-muted">Browse the shop and tap &quot;Add to cart&quot;.</p>
        <Link href="/shop" className="btn-primary mt-5">Shop supplies</Link>
      </div>
    );

  const blocked = !me?.canOrder;
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
      <section aria-label="Items">
        <ul className="grid gap-3">
          {lines.map((l) => (
            <li key={`${l.sheet}|${l.row}|${l.column}`} className="card flex gap-3 p-3 sm:p-4">
              <ProductTile product={l.product} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{l.product.name}</p>
                <p className="text-sm text-muted">{[l.variant.label, l.variant.sub].filter(Boolean).join(" · ")}</p>
                <p className="mt-0.5 text-sm">{l.price != null ? `${formatPeso(l.price)} ${l.product.unit}` : me?.canOrder ? "Not available at your branch" : "Sign in to see your price"}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="w-36">
                    <QtyStepper value={l.qty} onChange={(n) => setCartQty(l, n)} label={l.product.name} />
                  </div>
                  <p className="font-display text-lg font-bold tabular-nums">{l.total != null ? formatPeso(l.total) : "–"}</p>
                </div>
              </div>
              <button type="button" onClick={() => removeFromCart(l)} aria-label={`Remove ${l.product.name}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-brand-red-deep">
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/shop" className="btn-ghost"><Plus size={18} aria-hidden /> Add more products</Link>
          <button type="button" onClick={() => confirm("Remove everything from your cart?") && clearCart()} className="text-sm font-medium text-muted underline hover:text-brand-red-deep">
            Empty cart
          </button>
        </div>
      </section>

      <aside className="card hidden p-5 lg:block">
        <Summary subtotal={subtotal} count={lines.length} blocked={blocked} missing={missing} />
      </aside>
      {/* Mobile: total and checkout always within thumb reach */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white px-4 py-3 shadow-lift md:bottom-0 lg:hidden">
        <Summary subtotal={subtotal} count={lines.length} blocked={blocked} missing={missing} compact />
      </div>
    </div>
  );
}

function Summary({ subtotal, count, blocked, missing, compact = false }: { subtotal: number; count: number; blocked: boolean; missing: boolean; compact?: boolean }) {
  const { me } = useShop();
  return (
    <div className={compact ? "flex items-center gap-3" : "grid gap-3"}>
      <div className={compact ? "min-w-0 flex-1" : ""}>
        <p className="text-sm text-muted">Subtotal · {count} item{count === 1 ? "" : "s"}</p>
        <p className="font-display text-2xl font-extrabold tabular-nums">{formatPeso(subtotal)}</p>
        {!compact && <p className="mt-1 text-xs text-muted">Shipping is paid by the buyer. The branch confirms any minimum-order adjustment.</p>}
      </div>
      {blocked ? (
        <Link href={me?.signedIn ? "/account" : "/login?next=/checkout"} className={`btn-primary ${compact ? "" : "w-full"}`}>
          {me?.signedIn ? "Account on hold" : "Sign in to check out"}
        </Link>
      ) : (
        <Link href="/checkout" aria-disabled={missing} className={`btn-primary ${compact ? "" : "w-full"} ${missing ? "pointer-events-none opacity-50" : ""}`}>
          Checkout <ArrowRight size={18} aria-hidden />
        </Link>
      )}
    </div>
  );
}
