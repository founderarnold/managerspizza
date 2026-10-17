"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Package, ShoppingBag, ShoppingCart } from "lucide-react";
import { useShop } from "./shop/ShopProvider";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: ShoppingCart, badge: "cart" as const },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: "unread" as const },
];

export function TabBar() {
  const pathname = usePathname();
  const { cartCount, me } = useShop();
  return (
    <nav aria-label="Quick" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, badge }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const n = badge === "cart" ? cartCount : badge === "unread" ? me?.unread ?? 0 : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={n ? `${label}, ${n}` : label}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-brand-red-deep" : "text-muted"}`}
              >
                <span className="relative">
                  <Icon size={21} aria-hidden strokeWidth={active ? 2.4 : 1.8} />
                  {n > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-brand-red-deep px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                      {n > 99 ? "99+" : n}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
