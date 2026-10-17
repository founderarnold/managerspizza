"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardList, LogIn, Menu, Phone, UserRound, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { Logo } from "./Logo";
import { useQuote } from "./QuoteProvider";
import { useSignedIn } from "./useSignedIn";
import { useOpenBranches } from "./BranchesProvider";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { count } = useQuote();
  const signedIn = useSignedIn();
  const openBranches = useOpenBranches().length;
  const account = signedIn
    ? { href: "/account", label: "My account", Icon: UserRound }
    : { href: `/login${pathname && pathname !== "/" && !pathname.startsWith("/login") ? `?next=${encodeURIComponent(pathname)}` : ""}`, label: "Sign in", Icon: LogIn };

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
          <span>Pizza supplies at depot prices · {openBranches} branches nationwide</span>
          <a href={`tel:${SITE.phoneLinks[0]}`} className="inline-flex items-center gap-1.5 hover:text-brand-yellow">
            <Phone size={13} aria-hidden /> {SITE.phones.join(" / ")}
          </a>
        </div>
      </div>
      <div className={`container-x flex items-center justify-between gap-4 transition-all duration-200 ${scrolled ? "h-16" : "h-[72px] md:h-20"}`}>
        <Logo priority className={`w-auto transition-all duration-200 ${scrolled ? "h-10 md:h-12" : "h-11 md:h-14"}`} />
        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[14.5px] font-medium transition ${
                  active ? "bg-sand text-ink" : "text-graphite hover:bg-sand hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={account.href}
            aria-label={account.label}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-line bg-white px-3 text-[15px] font-semibold text-ink transition hover:border-ink/40 sm:px-4 ${
              pathname.startsWith("/account") || pathname.startsWith("/login") ? "border-ink/40 bg-sand" : ""
            }`}
          >
            <account.Icon size={18} aria-hidden />
            <span className="hidden sm:inline lg:hidden xl:inline">{account.label}</span>
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
              <Link href={account.href} className="flex items-center gap-2 rounded-xl px-3 py-3 text-base font-semibold text-brand-red-deep hover:bg-sand">
                <account.Icon size={18} aria-hidden /> {account.label}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
