import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { RegisterForm } from "@/components/auth/AuthForms";
import { FlameButton } from "@/components/auth/FlameButton";
import { hubLoginUrl, ssoEnabled } from "@/lib/flame-sso";
import { SITE } from "@/lib/site";
import { TIERS } from "@/lib/tiers";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  if (await getViewer()) redirect("/account");
  return (
    <div className="container-x py-10 md:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        <div className="card p-6 sm:p-8">
          <h1 className="text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-muted">
            It&apos;s free. Retailers and resellers see their prices and can order right away. Only Exclusive Distributor applications with territorial rights need approval.
          </p>
          <div className="mt-6">
            {ssoEnabled() && (
              <div className="mb-6">
                <FlameButton href={hubLoginUrl(`${SITE.url}/account`)} label="Join with your FLAME PH account" />
              </div>
            )}
            <RegisterForm />
          </div>
        </div>
        <aside className="card content-start p-5">
          <h2 className="font-bold">Price levels</h2>
          <p className="mt-1 text-sm text-muted">Retailers start at Barangay Retailer and resellers or online sellers at City Reseller prices. Distributor levels come with an approved Exclusive Distributor application.</p>
          <ul className="mt-4 grid gap-3 text-sm">
            {TIERS.map((t) => (
              <li key={t.id}>
                <strong>{t.name}</strong>
                <span className="block text-muted">{t.who}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
