import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NotConfigured } from "@/components/Dash";
import { PriceTable } from "@/components/PriceTable";
import { AddToQuote } from "@/components/AddToQuote";
import { requireViewer } from "@/lib/auth";
import { branchName } from "@/lib/branches";
import { CATEGORIES, PRICE_LIST_SOURCE, sheetsInCategory } from "@/lib/catalog";
import { sheetFor } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase-server";
import { tierName } from "@/lib/tiers";

export const metadata: Metadata = { title: "My price list", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyPricesPage({ searchParams }: { searchParams: Promise<{ sheet?: string }> }) {
  if (!supabaseAdmin()) return <NotConfigured />;
  const v = await requireViewer("/account/prices");
  const { sheet: slug = "classic-r2c-pizza" } = await searchParams;
  const approved = v.profile?.status === "approved";
  const ctx = approved ? { tier: v.profile?.tier ?? undefined, branch: v.profile?.branch_slug ?? undefined } : {};
  const sheet = sheetFor(slug, ctx) ?? sheetFor("classic-r2c-pizza", ctx)!;

  return (
    <div className="container-x py-8 md:py-12">
      <Link href="/account" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> My account
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">My price list</h1>
      <p className="mt-2 text-graphite">
        {approved
          ? <>Prices for <strong>{tierName(v.profile?.tier)}</strong> at <strong>{branchName(v.profile?.branch_slug)}</strong>.</>
          : <>Your account is waiting for approval, so these are the published prices.</>}{" "}
        Updated {PRICE_LIST_SOURCE.effectiveLabel}.
      </p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Products" className="grid content-start gap-4">
          {CATEGORIES.map((c) => (
            <div key={c.id}>
              <p className="text-xs font-bold uppercase tracking-wide text-muted">{c.name}</p>
              <ul className="mt-1 grid">
                {sheetsInCategory(c.id).map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/account/prices?sheet=${s.slug}`}
                      aria-current={s.slug === sheet.slug ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm ${s.slug === sheet.slug ? "bg-ink font-semibold text-white" : "hover:bg-sand"}`}
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold">{sheet.name}</h2>
          <div className="mt-4"><PriceTable sheet={sheet} /></div>
          <p className="mt-3 text-xs text-muted">Prices in PHP, {sheet.unit}. Subject to change without prior notice.</p>
          <h3 className="mt-8 text-lg font-bold">Add to your quotation</h3>
          <div className="mt-3"><AddToQuote sheet={sheet} /></div>
        </div>
      </div>
    </div>
  );
}
