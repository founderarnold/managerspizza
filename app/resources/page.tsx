import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = { title: "Resources", description: "Guides, videos and templates for pizza entrepreneurs.", alternates: { canonical: "/resources" } };

const ITEMS = [
  { t: "Price list (May 2026)", d: "The current Manager's Pizza price list, online.", s: "Live", href: "/shop" },
  { t: "Branch map", d: "All initial branches on one map.", s: "Live", href: "/branches" },
  { t: "Storing frozen R2C pizzas and crusts", d: "Freezer setup and handling for frozen supplies.", s: "Planned" },
  { t: "Opening checklist for a home-based pizza business", d: "Permits, equipment and first order.", s: "Planned" },
  { t: "Costing template", d: "Work out your price per slice and per box.", s: "Planned" },
  { t: "Short training videos", d: "Baking, slicing and packing for new staff.", s: "Planned" },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero eyebrow="Resources" title="Guides and tools for pizza entrepreneurs">Each resource is marked Live or Planned, so you know what is ready today.</PageHero>
      <div className="container-x grid gap-4 py-12 md:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((i) => {
          const body = (
            <>
              <span className={`chip ${i.s === "Live" ? "bg-[#e3f3e8] text-success" : ""}`}>{i.s}</span>
              <h2 className="mt-3 text-lg font-bold">{i.t}</h2>
              <p className="mt-1 text-sm text-muted">{i.d}</p>
            </>
          );
          return i.href ? (
            <a key={i.t} href={i.href} className="card p-5 transition hover:shadow-lift">{body}</a>
          ) : (
            <div key={i.t} className="card p-5 opacity-80">{body}</div>
          );
        })}
      </div>
    </>
  );
}
