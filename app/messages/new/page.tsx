import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { getBranches } from "@/lib/branches-db";
import { NewConversationForm } from "@/components/messages/NewConversationForm";

export const metadata: Metadata = { title: "New message", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function NewMessagePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const v = await requireViewer(`/messages/new${order ? `?order=${encodeURIComponent(order)}` : ""}`);
  const branches = (await getBranches()).filter((b) => b.status === "open");
  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <Link href="/messages" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Messages
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">New message</h1>
      <div className="card mt-5 max-w-2xl p-5">
        <NewConversationForm
          order={order ?? ""}
          defaultBranch={v.profile?.branch_slug ?? ""}
          branches={branches.map((b) => ({ slug: b.slug, label: `${b.city}, ${b.province}` }))}
        />
      </div>
    </div>
  );
}
