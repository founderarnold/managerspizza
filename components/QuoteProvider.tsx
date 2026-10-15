"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface QuoteItem {
  id: string; // sheet:row:column
  sheet: string;
  name: string; // e.g. Classic R2C Pizza: Pepperoni
  option: string; // e.g. 12" w/ box
  unitPrice: number | null;
  qty: number;
}

interface QuoteCtx {
  items: QuoteItem[];
  add: (item: Omit<QuoteItem, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: number;
  toast: string | null;
}

const Ctx = createContext<QuoteCtx | null>(null);
const KEY = "mp-quote-v1";

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const add = useCallback((item: Omit<QuoteItem, "qty">, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p));
      return [...prev, { ...item, qty }];
    });
    setToast(`Added to your quote: ${item.name} (${item.option})`);
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, Math.floor(qty) || 1) } : p)));
  }, []);
  const remove = useCallback((id: string) => setItems((prev) => prev.filter((p) => p.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({ items, add, setQty, remove, clear, count: items.length, toast }),
    [items, add, setQty, remove, clear, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 md:bottom-6">
        {toast && (
          <div className="pointer-events-auto rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lift">{toast}</div>
        )}
      </div>
    </Ctx.Provider>
  );
}

export function useQuote() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useQuote must be used inside QuoteProvider");
  return ctx;
}
