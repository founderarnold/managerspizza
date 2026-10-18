import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogIn } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { SignInForm } from "@/components/auth/AuthForms";
import { SITE } from "@/lib/site";
import { hubLoginUrl, ssoEnabled } from "@/lib/flame-sso";
import { FlameButton } from "@/components/auth/FlameButton";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: raw } = await searchParams;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account";
  if (await getViewer()) redirect(next);
  return (
    <div className="container-x py-12 md:py-16">
      <div className="card mx-auto max-w-md p-6 sm:p-8">
        <LogIn size={30} className="text-brand-red-deep" aria-hidden />
        <h1 className="mt-3 text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-muted">See your price level, track your quotation requests and, for staff, open your branch dashboard.</p>
        <div className="mt-6 grid gap-5">
          {ssoEnabled() && <FlameButton href={hubLoginUrl(`${SITE.url}${next}`)} />}
          <SignInForm next={next} />
        </div>
        <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          Forgot your password? Call or SMS {SITE.phones[0]} and our team will set a temporary password for you.
        </p>
      </div>
    </div>
  );
}
