import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { POLICIES } from "@/lib/policies";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return POLICIES.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = POLICIES.find((x) => x.slug === slug);
  return p ? { title: p.title, alternates: { canonical: `/policies/${slug}` } } : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = POLICIES.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <div className="container-x max-w-3xl py-12">
      <span className="chip bg-brand-yellow-soft">Draft – under review</span>
      <h1 className="mt-3 text-4xl font-extrabold">{p.title}</h1>
      <div className="mt-6 grid gap-4 leading-relaxed text-graphite">
        <p>The final text of this policy is being reviewed and will be published here.</p>
        {slug === "privacy" && (
          <p>
            Until then: we use the details you send through our forms only to answer your request, and we will only send you marketing messages if you tick the optional box. You can ask us to correct or delete your details by calling {SITE.phones[0]}.
          </p>
        )}
        {slug === "shipping-payments" && (
          <p>
            Until then: shipping is always paid by the buyer and quoted before you confirm. Cash on delivery is only offered inside a branch&apos;s local delivery area. Orders shipped by courier, bus, air or truck need full payment before dispatch.
          </p>
        )}
        <p>Questions? Call or text {SITE.phones.join(" / ")}.</p>
      </div>
    </div>
  );
}
