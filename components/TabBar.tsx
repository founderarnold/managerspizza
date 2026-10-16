"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSignedIn } from "./useSignedIn";
import { ClipboardList, Home, MapPin, ShoppingBag, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/branches", label: "Branches", icon: MapPin },
  { href: "/quote", label: "Quote", icon: ClipboardList },
  { href: "/account", label: "Account", icon: User },
];

export function TabBar() {
  const pathname = usePathname();
  const signedIn = useSignedIn();
  const tabs = TABS.map((t) => (t.href === "/account" && !signedIn ? { ...t, href: "/login", label: "Sign in" } : t));
  return (
    <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href) || (href === "/login" && pathname.startsWith("/account"));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
                  active ? "text-brand-red-deep" : "text-muted"
                }`}
              >
                <Icon size={21} aria-hidden strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
