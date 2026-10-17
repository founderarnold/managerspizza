"use client";

import Link from "next/link";
import { useState } from "react";
import { Boxes, ChefHat, ClipboardList, Lock, Minus, Package, Pizza, Plus, ShoppingCart, Snowflake, Thermometer, Wheat } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatPeso } from "@/lib/catalog";
import { useShop } from "./ShopProvider";
import { useQuote } from "@/components/QuoteProvider";

export const CATEGORY_ICON = { "ready-to-cook": Pizza, "dough-crust": Wheat, "cheese-sauce-toppings": ChefHat, "boxes-packaging": Boxes, equipment: Package } as const;
const TILE = {
  "ready-to-cook": "from-brand-yellow to-[#ffcf5c]",
  "dough-crust": "from-[#f6e3c3] to-[#fff3dc]",
  "cheese-sauce-toppings": "from-[#ffe7b0] to-[#fff8ec]",
  "boxes-packaging": "from-[#e9dccb] to-[#f7f0e6]",
  equipment: "from-[#e6e6e6] to-[#f6f6f6]",
} as const;

export function ProductTile({ product, size = "md" }: { product: Pick<Product, "category" | "handling">; size?: "sm" | "md" }) {
  const Icon = CATEGORY_ICON[product.category];
  return (
    <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br ${TILE[product.category]} ${size === "sm" ? "h-14 w-14 shrink-0" : "h-24"}`}>
      <Icon size={size === "sm" ? 26 : 40} className="text-ink/80" aria-hidden strokeWidth={1.6} />
      {product.handling !== "ambient" && size === "md" && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold">
          {product.handling === "frozen" ? <Snowflake size={11} aria-hidden /> : <Thermometer size={11} aria-hidden />}
          {product.handling === "frozen" ? "Frozen" : "Chilled"}
        </span>
      )}
    </div>
  );
}

export function QtyStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex h-11 items-center justify-between rounded-full border border-line bg-white">
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full active:bg-sand" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(1, value - 1))}>
        <Minus size={16} />
      </button>
      <input
        aria-label={`Quantity of ${label}`}
        className="w-12 min-w-0 flex-1 bg-transparent text-center font-semibold tabular-nums focus:outline-none"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value.replace(/\D/g, ""))) || 1))}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full active:bg-sand" aria-label={`More ${label}`} onClick={() => onChange(value + 1)}>
        <Plus size={16} />
      </button>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { me, priceOf, addToCart } = useShop();
  const { add: addToQuote } = useQuote();
  const [vi, setVi] = useState(0);
  const [qty, setQty] = useState(1);
  const v = product.variants[vi] ?? product.variants[0];
  const price = v ? priceOf(product.sheet, v.row, v.column) : null;
  const optionText = [v?.label, v?.sub].filter(Boolean).join(" · ");

  return (
    <article className="card flex flex-col p-3 sm:p-4">
      <ProductTile product={product} />
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{product.sheetName}</p>
      <h3 className="mt-0.5 font-display text-[17px] font-bold leading-snug">{product.name}</h3>

      {product.variants.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${product.name} options`}>
          {product.variants.map((x, i) => (
            <button
              key={x.key}
              type="button"
              role="radio"
              aria-checked={i === vi}
              onClick={() => setVi(i)}
              title={x.sub}
              className={`min-h-9 rounded-full border px-3 text-[13px] font-semibold transition ${
                i === vi ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"
              }`}
            >
              {product.variants.filter((y) => y.label === x.label).length > 1 && x.sub ? `${x.label} · ${x.sub}` : x.label}
            </button>
          ))}
        </div>
      )}
      {v?.sub && <p className="mt-1.5 text-xs text-muted">{v.sub}</p>}

      <div className="mt-auto pt-3">
        {product.rfq ? (
          <>
            <p className="text-sm font-semibold text-brand-red-deep">Request for Quotation</p>
            <p className="text-xs text-muted">Made to order. We reply with your price.</p>
          </>
        ) : me?.canOrder ? (
          <p className="flex items-baseline gap-1.5">
            <strong className="font-display text-2xl tabular-nums">{price != null ? formatPeso(price) : "–"}</strong>
            <span className="text-xs text-muted">{product.unit}</span>
          </p>
        ) : me === null ? (
          <div className="h-8 w-24 animate-pulse rounded bg-sand" aria-hidden />
        ) : me.signedIn ? (
          <p className="text-sm text-muted">{me.status === "suspended" ? "Account on hold" : "Price shown once your account is approved"}</p>
        ) : (
          <Link href="/login?next=/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red-deep">
            <Lock size={14} aria-hidden /> Sign in to see your price
          </Link>
        )}

        <div className="mt-3 grid gap-2">
          <QtyStepper value={qty} onChange={setQty} label={product.name} />
          {product.rfq ? (
            <button
              type="button"
              className="btn-dark !px-3"
              onClick={() => addToQuote({ id: `${product.sheet}:${v.row}:${v.column}`, sheet: product.sheet, name: product.name, option: optionText, unitPrice: null }, qty)}
            >
              <ClipboardList size={17} aria-hidden /> Request quote
            </button>
          ) : me?.canOrder ? (
            <button
              type="button"
              className="btn-primary !px-3"
              disabled={price == null}
              onClick={() => addToCart({ sheet: product.sheet, row: v.row, column: v.column }, qty, `${product.name} (${v.label})`)}
            >
              <ShoppingCart size={17} aria-hidden /> Add to cart
            </button>
          ) : (
            <Link href={me?.signedIn ? "/account" : "/login?next=/shop"} className="btn-ghost !px-3 text-sm">
              {me?.signedIn ? "My account" : "Sign in"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
