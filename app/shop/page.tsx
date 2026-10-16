import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { CATEGORIES, HANDLING_LABEL, PRICE_LIST_SOURCE, formatPeso, priceRange } from "@/lib/catalog";
import { priceSheets } from "@/lib/prices-db";
import { PageHero } from "@/components/PageHero";
import { PRICE_NOTE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shop Pizza Supplies & Price List",
  description: "Manager's Pizza price list: ready-to-cook pizzas, dough and crust, cheese, sauces, toppings, pizza boxes and equipment.",
  alternates: { canonical: "/shop" },
};

export const revalidate = 300;

export default async function ShopPage() {
  const sheets = await priceSheets();
  return (
    <>
      <PageHero eyebrow="Shop supplies" title="Pizza supplies price list">
        Ready-to-cook pizzas, crusts, cheese, toppings, boxes and equipment. Add what you need to a quote and the nearest branch confirms it.
      </PageHero>
      <div className="sticky top-16 z-30 border-b border-line bg-cream/95 backdrop-blur">
        <nav aria-label="Categories" className="container-x flex gap-2 overflow-x-auto py-3">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink/40">
              {c.name}
            </a>
          ))}
        </nav>
      </div>
      <div className="container-x py-10">
        <p className="flex gap-3 rounded-2xl border border-brand-yellow bg-brand-yellow-soft/50 p-4 text-sm leading-relaxed">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            <strong>Price list updated {PRICE_LIST_SOURCE.effectiveLabel}.</strong> {PRICE_NOTE}
          </span>
        </p>
        {CATEGORIES.map((c) => (
          <section key={c.id} id={c.id} className="scroll-mt-36 pt-12">
            <h2 className="text-2xl font-bold md:text-3xl">{c.name}</h2>
            <p className="mt-1 text-muted">{c.blurb}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sheets.filter((s) => s.category === c.id).map((s) => {
                const r = priceRange(s);
                return (
                  <Link key={s.slug} href={`/shop/${s.slug}`} className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                    <div className="flex items-center gap-2">
                      <span className="chip">{HANDLING_LABEL[s.handling]}</span>
                      <span className="chip">{s.rows.length} items</span>
                    </div>
                    <h3 className="mt-3 text-xl font-bold">{s.name}</h3>
                    <p className="mt-1 flex-1 text-sm leading-relaxed text-muted">{s.summary}</p>
                    <div className="mt-5 flex items-end justify-between">
                      <p className="text-sm text-muted">
                        <span className="block text-xs uppercase tracking-wide">{s.unit}</span>
                        <strong className="text-lg text-ink tabular-nums">{formatPeso(r.min)} – {formatPeso(r.max)}</strong>
                      </p>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-sand transition group-hover:bg-brand-red-deep group-hover:text-white">
                        <ArrowRight size={18} aria-hidden />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
