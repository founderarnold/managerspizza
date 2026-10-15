import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { PROGRAMS } from "@/lib/partners";
import { SimpleLeadForm } from "@/components/SimpleLeadForm";

export function generateStaticParams() {
  return PROGRAMS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PROGRAMS.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.short, alternates: { canonical: `/partners/${p.slug}` } } : {};
}

export default async function ProgramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = PROGRAMS.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <div className="container-x py-8 md:py-12">
      <Link href="/partners" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> All programs
      </Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_480px]">
        <div>
          <h1 className="text-4xl font-extrabold md:text-5xl">{p.name}</h1>
          <p className="mt-3 text-lg text-graphite">{p.short}</p>
          <h2 className="mt-8 text-lg font-bold">Who it is for</h2>
          <p className="mt-1 text-graphite">{p.who}</p>
          <h2 className="mt-6 text-lg font-bold">What you get</h2>
          <ul className="mt-2 grid gap-2">
            {p.get.map((g) => (
              <li key={g} className="flex gap-2"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />{g}</li>
            ))}
          </ul>
          <h2 className="mt-6 text-lg font-bold">Requirements</h2>
          <ul className="mt-2 grid gap-2">
            {p.requirements.map((g) => (
              <li key={g} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" aria-hidden />{g}</li>
            ))}
          </ul>
          <p className="mt-6 rounded-xl bg-sand p-4 text-sm text-graphite">All terms are subject to a signed agreement. Read the <Link href="/policies/partner-program-terms" className="underline">Partner Program Terms</Link>.</p>
        </div>
        <section className="card p-5 sm:p-6" aria-labelledby="apply-h">
          <h2 id="apply-h" className="text-xl font-bold">Apply</h2>
          <div className="mt-4">
            <SimpleLeadForm kind="partner" program={p.slug} submitLabel="Submit application" />
          </div>
        </section>
      </div>
    </div>
  );
}
