import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { PROGRAMS } from "@/lib/partners";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Partner Programs",
  description: "Grow with Manager's Pizza as an affiliate, dropshipper, distributor, reseller, networking company or accredited supplier.",
  alternates: { canonical: "/partners" },
};

export default function PartnersPage() {
  return (
    <>
      <PageHero eyebrow="Partners" title="Grow with Manager's Pizza">
        Six ways to partner with us. Every program has clear, published terms, and all terms are subject to a signed agreement.
      </PageHero>
      <div className="container-x py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <Link key={p.slug} href={`/partners/${p.slug}`} className="card group flex flex-col p-6 transition hover:shadow-lift">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="mt-2 flex-1 text-muted">{p.short}</p>
              <span className="mt-5 inline-flex items-center gap-1 font-semibold text-brand-red-deep group-hover:underline">
                Details and apply <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
        <section className="mt-14">
          <h2 className="text-2xl font-bold">Account levels</h2>
          <p className="mt-2 max-w-2xl text-muted">
            Each approved account is assigned one of five price levels based on its type and territory. For now every level uses the same published price list; level-specific prices will be shown to signed-in partners.
          </p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {TIERS.map((t, i) => (
              <li key={t.id} className="rounded-2xl border border-line bg-white p-4">
                <span className="text-xs font-bold text-brand-red-deep">Level {i + 1}</span>
                <h3 className="mt-1 font-bold">{t.name}</h3>
                <p className="mt-1 text-sm text-muted">{t.who}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
