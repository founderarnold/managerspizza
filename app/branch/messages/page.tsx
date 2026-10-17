import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { formatDate } from "@/lib/leads";
import { staffConversations } from "@/lib/messages-db";

export const metadata: Metadata = { title: "Branch inbox", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const v = await requireStaff("/branch/messages");
  const { show = "open" } = await searchParams;
  const [all, branches] = await Promise.all([staffConversations(v), getAllBranches()]);
  const list = all.filter((c) => (show === "all" ? true : c.status === show));
  const ids = [...new Set(list.map((c) => c.user_id))];
  const { data: people } = ids.length ? await supabaseAdmin()!.from("profiles").select("id,full_name,business_name").in("id", ids) : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p]));

  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <Link href="/branch" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Branch dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Branch inbox</h1>
      <nav aria-label="Filter" className="mt-4 flex gap-2">
        {[["open", "Open"], ["closed", "Done"], ["all", "All"]].map(([id, label]) => (
          <Link key={id} href={`/branch/messages?show=${id}`} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${show === id ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            {label}
          </Link>
        ))}
      </nav>
      {list.length === 0 ? (
        <p className="card mt-5 p-6 text-muted">No conversations here.</p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {list.map((c) => {
            const unread = c.last_message_at > c.staff_read_at;
            const p = who.get(c.user_id);
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
                  {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-red-deep" aria-label="Unread" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${unread ? "font-bold" : "font-semibold"}`}>{c.subject}</p>
                    <p className="truncate text-sm text-muted">
                      {p?.full_name ?? "Customer"}{p?.business_name ? ` · ${p.business_name}` : ""} · {branches.find((b) => b.slug === c.branch_slug)?.city ?? "Head office"} · {formatDate(c.last_message_at, true)}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
