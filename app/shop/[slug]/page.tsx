import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Thermometer } from "lucide-react";
import { HANDLING_LABEL, HANDLING_NOTE, PRICE_SHEETS, categoryName } from "@/lib/catalog";
import { PRODUCTS } from "@/lib/products";
import { PriceBanner, ProductGrid } from "@/components/shop/Catalog";

export function generateStaticParams() {
  return PRICE_SHEETS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = PRICE_SHEETS.find((x) => x.slug === slug);
  if (!s) return {};
  return { title: s.name, description: s.summary, alternates: { canonical: `/shop/${s.slug}` } };
}

export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sheet = PRICE_SHEETS.find((x) => x.slug === slug);
  if (!sheet) notFound();
  const products = PRODUCTS.filter((p) => p.sheet === sheet.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: sheet.name,
    itemListElement: products.map((p, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "Product", name: p.name, brand: { "@type": "Brand", name: "Manager's Pizza" } } })),
  };

  return (
    <div className="container-x py-6 md:py-10">
      <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> {categoryName(sheet.category)}
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">{sheet.name}</h1>
      <p className="mt-2 max-w-2xl text-graphite">{sheet.summary}</p>
      <div className="mt-4">
        <PriceBanner />
      </div>
      <ProductGrid products={products} />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sheet.terms && (
          <div className="card p-5">
            <h2 className="font-bold">Order terms</h2>
            <ul className="mt-3 grid gap-2 text-sm text-graphite">
              {sheet.terms.map((t) => (
                <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" aria-hidden />{t}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted">The branch applies these when it confirms your order.</p>
          </div>
        )}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 font-bold"><Thermometer size={18} aria-hidden /> {HANDLING_LABEL[sheet.handling]}</h2>
          <p className="mt-2 text-sm text-graphite">{HANDLING_NOTE[sheet.handling]}</p>
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
