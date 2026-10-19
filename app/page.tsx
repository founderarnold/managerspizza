import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Handshake, MapPin, Snowflake, Store, Truck } from "lucide-react";
import { HeroPrice } from "@/components/shop/HeroPrice";
import { Catalog } from "@/components/shop/Catalog";
import { priceSheets } from "@/lib/prices-db";
import { getBranches } from "@/lib/branches-db";
import logoYellow from "@/public/brand/logo-full-on-yellow.png";
import { FlameAdSlot } from "@/components/FlameAdSlot";



export const revalidate = 300;

export default async function Home() {
  const BRANCHES = await getBranches();
  const all = await priceSheets();
  const classic = all[0];
  return (
    <>
      <section className="relative overflow-hidden bg-brand-yellow">
        <div className="container-x grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-yellow">
              <MapPin size={13} aria-hidden /> {BRANCHES.length} branches, Luzon to Mindanao
            </p>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.02] md:text-6xl">
              Everything your pizza business needs, at depot prices.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">
              Ready-to-cook pizzas, dough, cheese, toppings, boxes and equipment from Manager&apos;s Pizza, plus business packages and partner programs for Filipino entrepreneurs.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="btn-primary text-base">Shop supplies <ArrowRight size={18} aria-hidden /></Link>
              <Link href="/start-a-business" className="btn-dark text-base">Start a pizza business</Link>
              <Link href="/partners" className="btn-ghost text-base">Become a partner</Link>
            </div>
          </div>
          <div className="relative">
            <div className="card rotate-[1.5deg] p-6 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Best seller</p>
                <span className="chip"><Snowflake size={12} aria-hidden /> Frozen</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">{classic.name}</h2>
              <ul className="mt-4 divide-y divide-line">
                {classic.rows.slice(0, 5).map((r) => (
                  <li key={r.key} className="flex items-center justify-between py-2.5">
                    <span className="font-medium">{r.label}</span>
                    <span className="text-sm text-muted">
                      12&quot; <HeroPrice sheet={classic.slug} row={r.key} column={classic.columns[5].key} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={`/shop/${classic.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-red-deep hover:underline">
                See all sizes and order <ArrowRight size={15} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x py-5 md:py-7"><FlameAdSlot slot="HOME_AFTER_HERO" /></div>

      <section id="shop" className="container-x scroll-mt-20 py-10 md:py-14">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Shop supplies</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">Order online, pay by QR, track to your door</h2>
          </div>
          <Link href="/cart" className="inline-flex items-center gap-1 font-semibold text-brand-red-deep hover:underline">
            View my cart <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="mt-2">
          <Catalog />
        </div>
      </section>

      <section className="bg-white">
        <div className="container-x grid gap-10 py-16 md:py-20 lg:grid-cols-3">
          <div>
            <p className="eyebrow">How ordering works</p>
            <h2 className="mt-2 text-3xl font-bold md:text-4xl">From cart to your door</h2>
            <p className="mt-3 text-graphite">Shipping is paid by the buyer. Track every step of your order and message your branch anytime.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            {[
              ["Add to cart", "Sign in to see the price for your level. Made-to-order items go to a request for quotation."],
              ["Check out", "Choose pickup or delivery: Lalamove, Grab, Transportify, trucking, container, bus, van or jeep."],
              ["Pay by QR", "Scan the GCash, BDO, Maya or GoTyme QR code and upload your payment screenshot."],
              ["Track and reorder", "Follow your order from payment to delivery, and order again in one tap."],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-2xl border border-line bg-cream p-5">
                <span className="font-display text-3xl font-extrabold text-brand-red-deep">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-bold">{t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x py-16 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Store, title: "Start a Pizza Business", text: "Get help choosing equipment, supplies and a starting menu, or try our pilot Pizza Trial / Pahiram.", href: "/start-a-business", cta: "See how to start" },
            { icon: Handshake, title: "Partner programs", text: "Affiliates, dropshippers, distributors, resellers, networking companies and suppliers.", href: "/partners", cta: "Explore programs" },
            { icon: Truck, title: "Branches near you", text: `${BRANCHES.length} branches from Pangasinan and Quirino to Tacloban and Cagayan de Oro, with more opening soon.`, href: "/branches", cta: "Open the map" },
          ].map(({ icon: Icon, title, text, href, cta }) => (
            <Link key={href} href={href} className="card group p-6 transition hover:shadow-lift">
              <Icon size={26} className="text-brand-red-deep" aria-hidden />
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-red-deep group-hover:underline">
                {cta} <ArrowRight size={16} aria-hidden />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-brand-yellow">
        <div className="container-x flex flex-col items-center gap-8 py-14 text-center md:flex-row md:text-left">
          <Image src={logoYellow} alt="Manager's Pizza" className="h-24 w-auto md:h-28" sizes="300px" />
          <div className="flex-1">
            <h2 className="text-3xl font-bold">Ready to order or start your own pizza store?</h2>
            <p className="mt-2 text-ink/80">Send a quotation request and the nearest branch will get back to you.</p>
          </div>
          <Link href="/quote" className="btn-primary text-base">Request a quotation</Link>
        </div>
      </section>

      <section className="container-x py-14">
        <p className="eyebrow text-center">Part of one ecosystem</p>
        <div className="mt-5 grid gap-4 text-center sm:grid-cols-3">
          {[
            ["FLAME PH", "Member community and benefits", "https://www.flameph.org"],
            ["NegosyoDepot.com", "Ready-to-run negosyo packages", "https://www.negosyodepot.com"],
            ["MarketplacePH", "Products and supplies marketplace", "https://www.marketplaceph.com"],
          ].map(([n, d, u]) => (
            <a key={u} href={u} rel="noopener" className="rounded-2xl border border-line bg-white px-5 py-6 transition hover:border-ink/30">
              <span className="block font-display text-lg font-bold">{n}</span>
              <span className="text-sm text-muted">{d}</span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
