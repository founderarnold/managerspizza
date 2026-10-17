import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ClipboardList } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { priceSheets } from "@/lib/prices-db";
import { CATEGORIES } from "@/lib/catalog";
import { allBranches } from "@/lib/branches-db";
import { TIERS } from "@/lib/tiers";
import { PriceTable } from "@/components/PriceTable";

export const metadata: Metadata = { title: "My price list", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyPricesPage() {
  const v = await requireViewer("/account/prices");
  const p = v.profile;
  if (p?.status !== "approved") redirect("/account");
  const BRANCHES = await allBranches();
  const sheets = await priceSheets(p.branch_slug, p.tier);
  const tier = TIERS.find((t) => t.id === p.tier);
  const branch = BRANCHES.find((b) => b.slug === p.branch_slug);

  return (
    <div className="container-x py-8 md:py-12">
      <Link href="/account" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> My account
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">My price list</h1>
      <p className="mt-2 text-muted">
        Prices for <strong className="text-ink">{tier?.name}</strong>
        {branch ? <> at <strong className="text-ink">{branch.city}</strong></> : null}, in PHP. Shipping is quoted separately.
      </p>
      <nav aria-label="Categories" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="shrink-0 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink/40">
            {c.name}
          </a>
        ))}
      </nav>
      {CATEGORIES.map((c) => (
        <section key={c.id} id={c.id} className="scroll-mt-28 pt-10">
          <h2 className="text-2xl font-bold">{c.name}</h2>
          <div className="mt-4 grid gap-8">
            {sheets
              .filter((s) => s.category === c.id)
              .map((s) => (
                <div key={s.slug}>
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                    <h3 className="text-lg font-bold">{s.name} <span className="text-sm font-normal text-muted">· {s.unit}</span></h3>
                    <Link href={`/shop/${s.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-red-deep">
                      <ClipboardList size={15} aria-hidden /> Add to quote
                    </Link>
                  </div>
                  <PriceTable sheet={s} />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
