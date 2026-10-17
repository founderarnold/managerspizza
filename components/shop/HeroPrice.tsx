"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { formatPeso } from "@/lib/catalog";
import { useShop } from "./ShopProvider";

/** A price in the home hero card: the signed-in account's own price, otherwise a sign-in prompt. */
export function HeroPrice({ sheet, row, column }: { sheet: string; row: string; column: string }) {
  const { me, priceOf } = useShop();
  if (me === null) return <span className="inline-block h-5 w-12 animate-pulse rounded bg-sand align-middle" aria-hidden />;
  const p = me.canOrder ? priceOf(sheet, row, column) : null;
  if (p != null) return <strong className="ml-1 text-base text-ink tabular-nums">{formatPeso(p)}</strong>;
  return (
    <Link href="/login" className="ml-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-red-deep">
      <Lock size={12} aria-hidden /> Sign in
    </Link>
  );
}
