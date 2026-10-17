"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { priceKey } from "@/lib/products";
import { supabaseBrowser } from "@/lib/supabase/client";

export interface Me {
  signedIn: boolean;
  name?: string | null;
  status?: "pending" | "approved" | "suspended";
  canOrder?: boolean;
  tier?: string | null;
  tierName?: string | null;
  branch?: string | null;
  isStaff?: boolean;
  prices?: Record<string, number>;
  unread?: number;
}

export interface CartLine {
  sheet: string;
  row: string;
  column: string;
  qty: number;
}

interface ShopCtx {
  me: Me | null; // null while loading
  refreshMe: () => void;
  priceOf: (sheet: string, row: string, column: string) => number | null;
  cart: CartLine[];
  cartReady: boolean;
  cartCount: number;
  addToCart: (line: Omit<CartLine, "qty">, qty: number, label?: string) => void;
  setCartQty: (line: Omit<CartLine, "qty">, qty: number) => void;
  removeFromCart: (line: Omit<CartLine, "qty">) => void;
  clearCart: () => void;
  replaceCart: (lines: CartLine[]) => void;
  notify: (msg: string) => void;
}

const Ctx = createContext<ShopCtx | null>(null);
const KEY = "mp-cart-v1";
const same = (a: Omit<CartLine, "qty">, b: Omit<CartLine, "qty">) => a.sheet === b.sheet && a.row === b.row && a.column === b.column;

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pathname = usePathname();

  const refreshMe = useCallback(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ signedIn: false }));
  }, []);

  // Load on start, when the session changes, and on page changes (keeps the unread badge fresh).
  useEffect(() => {
    refreshMe();
    const sb = supabaseBrowser();
    if (!sb) return;
    const { data } = sb.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT") refreshMe();
    });
    return () => data.subscription.unsubscribe();
  }, [refreshMe]);
  useEffect(() => {
    if (loaded) refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCart(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, loaded]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const priceOf = useCallback((sheet: string, row: string, column: string) => me?.prices?.[priceKey(sheet, row, column)] ?? null, [me]);
  const addToCart = useCallback((line: Omit<CartLine, "qty">, qty: number, label?: string) => {
    const n = Math.max(1, Math.floor(qty) || 1);
    setCart((prev) => (prev.some((p) => same(p, line)) ? prev.map((p) => (same(p, line) ? { ...p, qty: p.qty + n } : p)) : [...prev, { ...line, qty: n }]));
    setToast(label ? `Added to cart: ${n} × ${label}` : "Added to cart");
  }, []);
  const setCartQty = useCallback((line: Omit<CartLine, "qty">, qty: number) => {
    setCart((prev) => prev.map((p) => (same(p, line) ? { ...p, qty: Math.min(100000, Math.max(1, Math.floor(qty) || 1)) } : p)));
  }, []);
  const removeFromCart = useCallback((line: Omit<CartLine, "qty">) => setCart((prev) => prev.filter((p) => !same(p, line))), []);
  const clearCart = useCallback(() => setCart([]), []);
  const replaceCart = useCallback((lines: CartLine[]) => setCart(lines), []);

  const value = useMemo(
    () => ({
      me,
      refreshMe,
      priceOf,
      cart,
      cartReady: loaded,
      cartCount: cart.length,
      addToCart,
      setCartQty,
      removeFromCart,
      clearCart,
      replaceCart,
      notify: setToast,
    }),
    [me, refreshMe, priceOf, cart, loaded, addToCart, setCartQty, removeFromCart, clearCart, replaceCart],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
        {toast && <div className="pointer-events-auto rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lift">{toast}</div>}
      </div>
    </Ctx.Provider>
  );
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
