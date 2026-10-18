import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { canOrder, requireViewer } from "@/lib/auth";
import { getBranches } from "@/lib/branches-db";
import { CheckoutForm } from "@/components/shop/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const v = await requireViewer("/checkout");
  const p = v.profile;
  const branches = (await getBranches()).filter((b) => b.status === "open");
  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <Link href="/cart" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Back to cart
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">Checkout</h1>
      {!canOrder(p) ? (
        <p className="card mt-6 p-6">
          Your account is on hold or not complete yet. <Link href="/account" className="font-semibold text-brand-red-deep underline">See my account</Link>
        </p>
      ) : (
        <CheckoutForm
          branches={branches.map((b) => ({ slug: b.slug, label: `${b.city}, ${b.province}` }))}
          defaults={{
            branch: p.branch_slug ?? "",
            name: p.full_name,
            mobile: p.mobile,
            address: [p.address, p.barangay, p.city, p.province].filter(Boolean).join(", "),
          }}
        />
      )}
    </div>
  );
}
