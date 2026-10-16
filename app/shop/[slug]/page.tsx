import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ClipboardList, Thermometer } from "lucide-react";
import { HANDLING_LABEL, HANDLING_NOTE, PRICE_LIST_SOURCE, PRICE_SHEETS, categoryName, formatPeso, priceRange } from "@/lib/catalog";
import { sheetFor } from "@/lib/pricing";
import { priceSheet } from "@/lib/prices-db";
import { PriceTable } from "@/components/PriceTable";
import { AddToQuote } from "@/components/AddToQuote";
import { PRICE_NOTE } from "@/lib/site";

// Prices come from the database; refresh the page at most every 5 minutes (and right after an admin saves prices).
export const revalidate = 300;

export function generateStaticParams() {
  return PRICE_SHEETS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = sheetFor(slug);
  if (!s) return {};
  return { title: `${s.name} Price List`, description: s.summary, alternates: { canonical: `/shop/${s.slug}` } };
}

export default async function SheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Public visitors see the base list; approved accounts see their own prices under My account.
  const sheet = await priceSheet(slug);
  if (!sheet) notFound();
  const range = priceRange(sheet);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: sheet.name,
    description: sheet.summary,
    brand: { "@type": "Brand", name: "Manager's Pizza" },
    offers: { "@type": "AggregateOffer", priceCurrency: "PHP", lowPrice: range.min, highPrice: range.max, offerCount: sheet.rows.length },
  };

  return (
    <div className="container-x py-8 md:py-12">
      <Link href={`/shop#${sheet.category}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> {categoryName(sheet.category)}
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <h1 className="text-4xl font-extrabold md:text-5xl">{sheet.name}</h1>
          <p className="mt-3 max-w-2xl text-lg text-graphite">{sheet.summary}</p>
          <div className="mt-8">
            <PriceTable sheet={sheet} />
          </div>
          <p className="mt-3 text-xs text-muted">Prices in PHP, {sheet.unit}. Updated {PRICE_LIST_SOURCE.effectiveLabel}. Prices are subject to change without prior notice.</p>
          <h2 className="mt-10 text-xl font-bold">Add to your quotation</h2>
          <div className="mt-4">
            <AddToQuote sheet={sheet} />
          </div>
        </div>
        <aside className="grid content-start gap-4">
          {sheet.terms && (
            <div className="card p-5">
              <h2 className="font-bold">Order terms</h2>
              <ul className="mt-3 grid gap-2 text-sm text-graphite">
                {sheet.terms.map((t) => (
                  <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" aria-hidden />{t}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 font-bold"><Thermometer size={18} aria-hidden /> {HANDLING_LABEL[sheet.handling]}</h2>
            <p className="mt-2 text-sm text-graphite">{HANDLING_NOTE[sheet.handling]}</p>
            <p className="mt-2 text-sm text-graphite">Available in selected areas. The branch confirms stock with your quote.</p>
          </div>
          <div className="rounded-2xl bg-ink p-5 text-white">
            <p className="text-sm text-white/70">Price range</p>
            <p className="font-display text-2xl font-bold tabular-nums">{formatPeso(range.min)} – {formatPeso(range.max)}</p>
            <p className="mt-3 text-xs leading-relaxed text-white/70">{PRICE_NOTE}</p>
            <p className="mt-2 text-xs text-white/90">
              Have an account? <Link href="/account/prices" className="font-semibold text-brand-yellow underline">See the price for your level and branch</Link>.
            </p>
            <Link href="/quote" className="btn mt-4 w-full bg-brand-yellow text-ink hover:bg-white">
              <ClipboardList size={18} aria-hidden /> View my quote
            </Link>
          </div>
        </aside>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
