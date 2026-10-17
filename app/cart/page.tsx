import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";

export const metadata: Metadata = { title: "My cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x pb-40 pt-6 md:pb-16 md:pt-10">
      <h1 className="text-3xl font-extrabold md:text-4xl">My cart</h1>
      <CartView />
    </div>
  );
}
