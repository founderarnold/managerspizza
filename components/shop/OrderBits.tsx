"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import type { OrderItem } from "@/lib/orders";
import { useShop } from "./ShopProvider";

/** Puts an earlier order's items back in the cart. */
export function ReorderButton({ items, className = "btn-ghost" }: { items: OrderItem[]; className?: string }) {
  const { cart, replaceCart, notify } = useShop();
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const next = [...cart];
        for (const i of items) {
          const at = next.findIndex((l) => l.sheet === i.sheet && l.row === i.row && l.column === i.column);
          if (at >= 0) next[at] = { ...next[at], qty: next[at].qty + i.qty };
          else next.push({ sheet: i.sheet, row: i.row, column: i.column, qty: i.qty });
        }
        replaceCart(next);
        notify("Items added to your cart at today's prices");
        router.push("/cart");
      }}
    >
      <RotateCcw size={17} aria-hidden /> Order again
    </button>
  );
}

/** Empties the cart once an order has been placed. */
export function ClearCartOnce() {
  const { clearCart } = useShop();
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
