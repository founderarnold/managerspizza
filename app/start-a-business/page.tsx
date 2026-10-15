import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, ClipboardCheck, Flame, PackageCheck, Rocket, Wallet } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SimpleLeadForm } from "@/components/SimpleLeadForm";

export const metadata: Metadata = {
  title: "Start a Pizza Business",
  description: "Start your own pizza business with Manager's Pizza: starter supplies, equipment, the Pizza Trial / Pahiram pilot and free consultation.",
  alternates: { canonical: "/start-a-business" },
};

const STEPS = [
  { icon: Wallet, t: "Set your goal and budget", d: "Home-based, food cart, kiosk or full store." },
  { icon: PackageCheck, t: "Choose your setup", d: "Oven, pans, crusts, cheese, toppings and boxes from our price list." },
  { icon: Flame, t: "Check member benefits", d: "FLAME PH members may get first-order benefits once the pilot opens." },
  { icon: ClipboardCheck, t: "Accept your quote", d: "The nearest branch confirms items, shipping and terms." },
  { icon: Rocket, t: "Launch and reorder", d: "Open your store and reorder supplies from the same branch." },
];

export default function StartPage() {
  return (
    <>
      <PageHero yellow eyebrow="Start a pizza business" title="Open your own pizza store with Manager's Pizza">
        We supply everything from the oven to the box, and help first-time entrepreneurs choose the right setup for their budget.
      </PageHero>

      <section className="container-x py-14">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 text-3xl font-bold">Five steps to your first sale</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-5">
          {STEPS.map(({ icon: Icon, t, d }, i) => (
            <li key={t} className="card p-5">
              <div className="flex items-center justify-between">
                <Icon size={24} className="text-brand-red-deep" aria-hidden />
                <span className="font-display text-sm font-bold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white">
        <div className="container-x grid gap-8 py-14 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Business packages</p>
            <h2 className="mt-2 text-3xl font-bold">Starter packages</h2>
            <p className="mt-3 text-graphite">
              Ready-made packages with equipment, opening supplies and training are being finalised. Until they are published, build your own starter list from the price list (for example a 30L electric oven, round pans, crusts, cheese, toppings and boxes) and we will quote it as a package.
            </p>
            <span className="chip mt-4 bg-brand-yellow-soft">Packages: coming soon</span>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-primary">Build a starter list</Link>
              <a href="#consultation" className="btn-ghost">Talk to us first</a>
            </div>
          </div>
          <div id="pizza-trial" className="scroll-mt-28 rounded-3xl border border-line bg-cream p-6">
            <p className="eyebrow">Pilot program</p>
            <h2 className="mt-2 text-2xl font-bold">Pizza Trial / Pahiram</h2>
            <p className="mt-2 text-graphite">Try running a pizza business with borrowed equipment before you buy.</p>
            <ul className="mt-4 grid gap-2 text-sm">
              {[
                "Pilot of 20 equipment sets in two branches that can deliver, inspect and retrieve equipment",
                "One active set per borrower, 30-day term, one approved extension of up to 14 days",
                "Requires verified contact and address, orientation, a signed agreement and a handover checklist",
                "Refundable deposit per package; a deposit waiver is possible only after qualifying checks",
              ].map((x) => (
                <li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red" aria-hidden />{x}</li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted">Applications are for interest only. No deposit or equipment booking is taken online yet.</p>
            <div className="mt-5">
              <SimpleLeadForm kind="trial" submitLabel="Register my interest" />
            </div>
          </div>
        </div>
      </section>

      <section id="consultation" className="container-x scroll-mt-28 py-14">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <CalendarCheck size={30} className="text-brand-red-deep" aria-hidden />
            <h2 className="mt-3 text-3xl font-bold">Book a free consultation</h2>
            <p className="mt-3 text-graphite">Tell us about your plans and a Manager&apos;s Pizza adviser will call you at your preferred time to help you choose equipment, a menu and supplies.</p>
          </div>
          <div className="card p-5 sm:p-6">
            <SimpleLeadForm kind="consultation" submitLabel="Book consultation" withSchedule />
          </div>
        </div>
      </section>
    </>
  );
}
