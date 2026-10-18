import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/auth/AccountForms";

export const metadata: Metadata = { title: "Complete your account", robots: { index: false } };
export const dynamic = "force-dynamic";

/** First visit with a FLAME PH account: a few details Manager's Pizza needs, then on to where they were going. */
export default async function CompletePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next: raw } = await searchParams;
  const next = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/account?welcome=1";
  const v = await requireViewer("/account/complete");
  if (v.profile) redirect(next);
  const user = (await (await supabaseServer())!.auth.getUser()).data.user;
  const name = (user?.user_metadata?.full_name as string | undefined) ?? (user?.user_metadata?.name as string | undefined) ?? "";

  return (
    <div className="container-x py-10 md:py-14">
      <div className="card mx-auto max-w-2xl p-6 sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-yellow-soft px-3 py-1 text-xs font-semibold">
          <Flame size={14} aria-hidden /> Signed in with your FLAME PH account
        </p>
        <h1 className="mt-4 text-3xl font-bold">Welcome to Manager&apos;s Pizza{name ? `, ${name.split(" ")[0]}` : ""}!</h1>
        <p className="mt-2 text-muted">
          You&apos;re signed in as <strong className="text-ink">{v.email}</strong>. Just a few details so our branch can serve you. Manager&apos;s Pizza then sets your price level.
        </p>
        <div className="mt-6">
          <ProfileForm profile={null} next={next} defaultName={name} />
        </div>
      </div>
    </div>
  );
}
