import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, Lock } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { priceSheets } from "@/lib/prices-db";
import { CATEGORIES } from "@/lib/catalog";
import { getAllBranches } from "@/lib/branches-db";
import { TIERS, type TierId } from "@/lib/tiers";
import { PriceTable } from "@/components/PriceTable";

export const metadata: Metadata = { title: "Price lists", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Full price tables: admins, branch staff, and Factory (company-owned branch) accounts only. */
export default async function PriceListsPage({ searchParams }: { searchParams: Promise<{ tier?: string; branch?: string }> }) {
  const v = await requireViewer("/account/prices");
  const sp = await searchParams;
  const p = v.profile;
  const isFactory = p?.status === "approved" && p.tier === "factory";
  if (!v.isStaff && !isFactory) redirect("/account");

  const branches = await getAllBranches();
  // Staff and admins can view any level; Factory accounts see the Factory list.
  const tier: TierId = v.isStaff && TIERS.some((t) => t.id === sp.tier) ? (sp.tier as TierId) : v.isStaff ? "factory" : "factory";
  const allowedBranches = v.isAdmin ? branches : branches.filter((b) => v.staffBranches?.includes(b.slug) || b.slug === p?.branch_slug);
  const branch = allowedBranches.find((b) => b.slug === sp.branch) ?? allowedBranches.find((b) => b.slug === p?.branch_slug) ?? null;
  const sheets = await priceSheets(branch?.slug ?? null, tier);

  return (
    <div className="container-x py-8 md:py-12">
      <Link href="/account" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> My account
      </Link>
      <h1 className="mt-3 flex items-center gap-2 text-3xl font-extrabold md:text-4xl">Price lists <Lock size={22} className="text-muted" aria-label="Internal" /></h1>
      <p className="mt-2 text-muted">
        For admins, branch staff and company-owned branches only. Showing <strong className="text-ink">{TIERS.find((t) => t.id === tier)?.name}</strong> prices
        {branch ? <> at <strong className="text-ink">{branch.city}</strong></> : " (all branches)"}, in PHP.
      </p>
      {v.isStaff && (
        <form className="mt-4 flex flex-wrap items-end gap-3" action="/account/prices">
          <label className="label">
            Price level
            <select className="field" name="tier" defaultValue={tier}>
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Branch
            <select className="field" name="branch" defaultValue={branch?.slug ?? ""}>
              {v.isAdmin && <option value="">All branches</option>}
              {allowedBranches.map((b) => (
                <option key={b.slug} value={b.slug}>{b.city}</option>
              ))}
            </select>
          </label>
          <button className="btn-dark" type="submit">Show</button>
          {v.isAdmin && <Link href="/admin?tab=prices" className="btn-ghost">Edit prices</Link>}
        </form>
      )}
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
                  <h3 className="mb-3 text-lg font-bold">{s.name} <span className="text-sm font-normal text-muted">· {s.unit}</span></h3>
                  <PriceTable sheet={s} />
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
