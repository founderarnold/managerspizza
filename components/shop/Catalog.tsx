"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BadgeCheck, Search, X } from "lucide-react";
import { CATEGORIES, type CategoryId } from "@/lib/catalog";
import { PRODUCTS, type Product } from "@/lib/products";
import { ProductCard } from "./ProductCard";
import { useShop } from "./ShopProvider";

/** Who sees which price, shown above the product grid. */
export function PriceBanner() {
  const { me } = useShop();
  if (me === null) return <div className="h-12 animate-pulse rounded-2xl bg-sand" aria-hidden />;
  if (me.canOrder)
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-[#e3f4e8] px-4 py-3 text-sm text-success">
        <BadgeCheck size={18} aria-hidden /> <span>Showing your <strong>{me.tierName}</strong> prices. Shipping is paid by the buyer.</span>
      </p>
    );
  if (me.signedIn)
    return (
      <p className="rounded-2xl bg-brand-yellow-soft/60 px-4 py-3 text-sm">
        Your account is waiting for approval. Prices and ordering open once Manager&apos;s Pizza sets your price level. You can already send a request for quotation.
      </p>
    );
  return (
    <p className="rounded-2xl bg-brand-yellow-soft/60 px-4 py-3 text-sm">
      Prices depend on your account level (Distributor, Reseller or Retailer).{" "}
      <Link href="/login?next=/shop" className="font-semibold text-brand-red-deep underline">Sign in</Link> or{" "}
      <Link href="/register" className="font-semibold text-brand-red-deep underline">create an account</Link> to see your price and order.
    </p>
  );
}

export function Catalog({ initialCategory }: { initialCategory?: CategoryId | "all" }) {
  const [cat, setCat] = useState<CategoryId | "all">(initialCategory ?? "all");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return PRODUCTS.filter(
      (p) => (cat === "all" || p.category === cat) && words.every((w) => `${p.name} ${p.sheetName}`.toLowerCase().includes(w)),
    );
  }, [cat, q]);

  return (
    <div>
      <div className="sticky top-16 z-30 -mx-4 border-b border-line bg-cream/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <label className="relative block">
          <span className="sr-only">Search products</span>
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pizza, cheese, boxes…"
            className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-10 text-[15px] focus:border-ink focus:outline-none"
          />
          {q && (
            <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full hover:bg-sand">
              <X size={16} />
            </button>
          )}
        </label>
        <nav aria-label="Categories" className="mt-3 flex gap-2 overflow-x-auto">
          {[{ id: "all" as const, name: "All" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              aria-pressed={cat === c.id}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${cat === c.id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40"}`}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        <PriceBanner />
      </div>
      {list.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-muted">No products match &quot;{q}&quot;.</p>
      ) : (
        <ProductGrid products={list} />
      )}
    </div>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
