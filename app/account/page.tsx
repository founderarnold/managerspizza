import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="container-x py-16">
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Lock size={34} className="mx-auto text-brand-red-deep" aria-hidden />
        <h1 className="mt-4 text-3xl font-bold">Accounts are coming soon</h1>
        <p className="mt-3 text-muted">
          Soon you will be able to sign in to see the price for your branch and account level, order online and track deliveries. Until then, send a quotation request and the nearest branch will reply with your price.
        </p>
        <Link href="/quote" className="btn-primary mt-6">Request a quotation</Link>
      </div>
    </div>
  );
}
