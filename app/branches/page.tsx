import type { Metadata } from "next";
import { MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { publicBranches } from "@/lib/branches-db";
import { BranchExplorer } from "@/components/BranchExplorer";
import { PageHero } from "@/components/PageHero";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const open = (await publicBranches()).filter((b) => b.status !== "opening_soon");
  return {
    title: "Branches & Map",
    description: `Find Manager's Pizza branches in ${open.map((b) => b.city.replace(/ City$/, "")).join(", ")}.`,
    alternates: { canonical: "/branches" },
  };
}

function listRegions(regions: string[]) {
  return regions.length > 1 ? `${regions.slice(0, -1).join(", ")} and ${regions[regions.length - 1]}` : regions[0] ?? "";
}

export default async function BranchesPage() {
  const branches = await publicBranches();
  const open = branches.filter((b) => b.status !== "opening_soon");
  const soon = branches.filter((b) => b.status === "opening_soon");
  const regions = ["Luzon", "Visayas", "Mindanao"].filter((r) => open.some((b) => b.region === r));
  return (
    <>
      <PageHero eyebrow="Branches" title="Our initial branches">
        Manager&apos;s Pizza starts with {open.length} branches across {listRegions(regions)}. Tap a branch to find it on the map. Orders are served by the nearest branch that can deliver to you.
      </PageHero>
      <div className="container-x py-10">
        <BranchExplorer branches={branches} />
        <p className="mt-3 text-xs text-muted">
          Pins for branches without a published street address mark the city or town. Call the Quezon City depot for directions until each branch&apos;s details are posted.
        </p>

        <section className="mt-12 overflow-hidden rounded-3xl bg-brand-yellow">
          <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:items-center md:p-10">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-brand-yellow">
              <Sparkles size={26} aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">More branches opening soon</h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-ink/85">
                These {open.length} are only the beginning. New Manager&apos;s Pizza branches are being prepared in more provinces and cities so that supplies reach you faster and at lower shipping cost. Opening dates and locations will be announced here as each one is confirmed. If you want a branch in your area, or want to run one yourself, tell us.
              </p>
              {soon.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {soon.map((b) => (
                    <li key={b.slug} className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-sm font-semibold">
                      <MapPin size={14} aria-hidden /> {b.city}, {b.province}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/partners/distributor" className="btn-primary">Apply to run a branch</Link>
              <Link href="/quote" className="btn-dark">Request supplies</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
