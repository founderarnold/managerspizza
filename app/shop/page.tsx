import type { Metadata } from "next";
import { Catalog } from "@/components/shop/Catalog";
import { FlameAdSlot } from "@/components/FlameAdSlot";

export const metadata: Metadata = {
  title: "Shop Pizza Supplies",
  description: "Order ready-to-cook pizzas, cheese, toppings, sauces and equipment online from Manager's Pizza. Request a quotation for dough, crusts, pizza boxes and other made-to-order items.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  return (
    <div className="container-x pb-12 pt-6 md:pt-10">
      <p className="eyebrow">Shop supplies</p>
      <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">Order pizza supplies</h1>
      <p className="mt-2 max-w-2xl text-graphite">
        Add items to your cart, pay by GCash, BDO, Maya or GoTyme, and track your order. Made-to-order items like dough, pizza boxes and hot sauce sachets are by request for quotation.
      </p>
      <FlameAdSlot slot="CATEGORY_TOP" category="pizza-supplies" className="mt-6" />
      <div className="mt-4">
        <Catalog />
      </div>
    </div>
  );
}
