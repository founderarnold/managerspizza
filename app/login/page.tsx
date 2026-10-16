import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getViewer()) redirect(next);
  return (
    <div className="container-x py-10 md:py-16">
      <div className="card mx-auto max-w-lg p-6 sm:p-8">
        <Logo className="mx-auto h-14 w-auto" />
        <h1 className="mt-5 text-center text-3xl font-bold">Your Manager&apos;s Pizza account</h1>
        <p className="mt-2 text-center text-graphite">See the price for your account level, track your quotations and reorder faster.</p>
        {sp.error && (
          <p role="alert" className="mt-4 rounded-xl bg-brand-red-deep/10 p-3 text-sm text-brand-red-deep">
            That link expired or was opened on a different phone or browser. If you just confirmed your email, sign in below with your password.
          </p>
        )}
        <div className="mt-6">
          <LoginForm next={next} initialMode={sp.mode === "signup" ? "signup" : "signin"} />
        </div>
      </div>
    </div>
  );
}
