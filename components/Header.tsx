"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, Menu, Phone, User, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { Logo } from "./Logo";
import { useQuote } from "./QuoteProvider";
import { useSignedIn } from "./useSignedIn";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useQuote();
  const signedIn = useSignedIn();
  const accountHref = signedIn ? "/account" : "/login";
  const accountLabel = signedIn ? "My account" : "Sign in";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-200 ${
        scrolled ? "border-line bg-white/85 backdrop-blur-md" : "border-transparent bg-white"
      }`}
    >
      <div className="hidden bg-ink text-white/90 md:block">
        <div className="container-x flex h-9 items-center justify-between text-xs">
          <span>Pizza supplies at depot prices · 11 branches nationwide</span>
          <a href={`tel:${SITE.phoneLinks[0]}`} className="inline-flex items-center gap-1.5 hover:text-brand-yellow">
            <Phone size={13} aria-hidden /> {SITE.phones.join(" / ")}
          </a>
        </div>
      </div>
      <div className={`container-x flex items-center justify-between gap-4 transition-all duration-200 ${scrolled ? "h-16" : "h-[72px] md:h-20"}`}>
        <Logo priority className={`w-auto transition-all duration-200 ${scrolled ? "h-10 md:h-12" : "h-11 md:h-14"}`} />
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-2 text-[14.5px] font-medium transition ${
                  active ? "bg-sand text-ink" : "text-graphite hover:bg-sand hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={accountHref} className="btn-ghost hidden !px-4 lg:inline-flex">
            <User size={18} aria-hidden /> {accountLabel}
          </Link>
          <Link
            href={accountHref}
            aria-label={accountLabel}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-line px-3 text-sm font-semibold lg:hidden"
          >
            <User size={19} aria-hidden />
            <span className="hidden min-[360px]:inline">{accountLabel}</span>
          </Link>
          <Link href="/quote" className="btn-primary !px-4" aria-label={`Quote list, ${count} items`}>
            <ClipboardList size={18} aria-hidden />
            <span className="hidden sm:inline">Quote</span>
            {count > 0 && (
              <span className="rounded-full bg-white px-1.5 text-xs font-bold text-brand-red-deep">{count}</span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white lg:hidden">
          <ul className="container-x grid gap-1 py-3">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                  {n.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href={accountHref} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-sand">
                {accountLabel}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
