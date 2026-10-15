import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

const GROUPS: { title: string; links: [string, string][] }[] = [
  {
    title: "Shop",
    links: [
      ["Ready-to-Cook Pizzas", "/shop#ready-to-cook"],
      ["Dough & Crust", "/shop#dough-crust"],
      ["Cheese, Sauce & Toppings", "/shop#cheese-sauce-toppings"],
      ["Boxes & Packaging", "/shop#boxes-packaging"],
      ["Equipment", "/shop#equipment"],
    ],
  },
  {
    title: "Partner with us",
    links: [
      ["Affiliate Program", "/partners/affiliate"],
      ["Dropshipper", "/partners/dropshipper"],
      ["Distributor & Reseller", "/partners/distributor-reseller"],
      ["Networking Company", "/partners/networking-company"],
      ["Supplier Accreditation", "/partners/supplier"],
    ],
  },
  {
    title: "Business",
    links: [
      ["Start a Pizza Business", "/start-a-business"],
      ["Pizza Trial / Pahiram", "/start-a-business#pizza-trial"],
      ["Book a consultation", "/start-a-business#consultation"],
      ["Request a quotation", "/quote"],
      ["Resources", "/resources"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About us", "/about"],
      ["Branches & map", "/branches"],
      ["Privacy Notice", "/policies/privacy"],
      ["Terms of Use", "/policies/terms"],
      ["Shipping & Payments", "/policies/shipping-payments"],
    ],
  },
  {
    title: "Ecosystem",
    links: [
      ["FLAME PH", "https://www.flameph.org"],
      ["NegosyoDepot.com", "https://www.negosyodepot.com"],
      ["MarketplacePH", "https://www.marketplaceph.com"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink pb-24 text-white/80 md:pb-0">
      <div className="container-x py-14">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <div className="inline-flex rounded-2xl bg-white px-5 py-4">
              <Logo className="h-[72px] w-auto md:h-20" />
            </div>
            <p className="mt-5 text-[15px] leading-relaxed">{SITE.tagline}</p>
          </div>
          <ul className="grid gap-3 text-[15px]">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden />
              <span>Manager&apos;s Pizza Depot · {SITE.address}</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden />
              <span>
                {SITE.phones.map((p, i) => (
                  <a key={p} href={`tel:${SITE.phoneLinks[i]}`} className="hover:text-white">
                    {p}
                    {i < SITE.phones.length - 1 ? " / " : ""}
                  </a>
                ))}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0 text-brand-yellow" aria-hidden />
              <Link href="/quote" className="hover:text-white">Send a quotation request</Link>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 py-10 md:grid-cols-3 lg:grid-cols-5">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h2 className="text-sm font-semibold tracking-wide text-white">{g.title}</h2>
              <ul className="mt-3 grid gap-2 text-sm">
                {g.links.map(([label, href]) => (
                  <li key={href}>
                    {href.startsWith("http") ? (
                      <a href={href} className="hover:text-white" rel="noopener">{label}</a>
                    ) : (
                      <Link href={href} className="hover:text-white">{label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Manager&apos;s Pizza. All rights reserved.</p>
          <p>Prices are in Philippine pesos and subject to change without prior notice.</p>
        </div>
      </div>
    </footer>
  );
}
