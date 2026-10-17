import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { SITE } from "@/lib/site";
import { publicBranches } from "@/lib/branches-db";

export const metadata: Metadata = { title: "About Us", description: "About Manager's Pizza, its depot, branches and ecosystem.", alternates: { canonical: "/about" } };

export default async function AboutPage() {
  const openCount = (await publicBranches()).filter((b) => b.status !== "opening_soon").length;
  return (
    <>
      <PageHero eyebrow="About" title="Pizza supplies and pizza businesses, made simple">
        Manager&apos;s Pizza supplies ready-to-cook pizzas, crusts, cheese, toppings, boxes and equipment to pizza stores and first-time entrepreneurs across the Philippines.
      </PageHero>
      <div className="container-x grid gap-10 py-12 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-bold">What we do</h2>
          <p className="mt-3 leading-relaxed text-graphite">
            From our depot in Quezon City and {openCount - 1} more initial branches, we help people start and grow pizza businesses: we supply ingredients and packaging at depot prices, help choose equipment, and work with distributors, resellers and partners so supplies reach every province.
          </p>
          <h2 className="mt-8 text-2xl font-bold">The ecosystem</h2>
          <ul className="mt-3 grid gap-2 text-graphite">
            <li><strong>Manager&apos;s Pizza</strong> (this site): pizza supplies, prices and orders.</li>
            <li><strong><a href="https://www.flameph.org" className="underline">FLAME PH</a></strong>: member identity, community and benefits.</li>
            <li><strong><a href="https://www.negosyodepot.com" className="underline">NegosyoDepot.com</a></strong>: negosyo packages, including Manager&apos;s Pizza packages.</li>
            <li><strong><a href="https://www.marketplaceph.com" className="underline">MarketplacePH</a></strong>: a marketplace for products and supplies.</li>
          </ul>
        </section>
        <section id="contact" className="card scroll-mt-28 p-6">
          <h2 className="text-2xl font-bold">Contact us</h2>
          <dl className="mt-4 grid gap-4">
            <div><dt className="text-sm text-muted">Main depot</dt><dd className="font-medium">Manager&apos;s Pizza Depot Quezon City<br />{SITE.address}</dd></div>
            <div>
              <dt className="text-sm text-muted">Phone / SMS</dt>
              <dd className="font-medium">{SITE.phones.map((p, i) => <a key={p} href={`tel:${SITE.phoneLinks[i]}`} className="mr-3 underline">{p}</a>)}</dd>
            </div>
            <div><dt className="text-sm text-muted">Website</dt><dd className="font-medium">www.managerspizza.com</dd></div>
          </dl>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote" className="btn-primary">Request a quotation</Link>
            <Link href="/branches" className="btn-ghost">Find a branch</Link>
          </div>
        </section>
      </div>
    </>
  );
}
