import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Inbox, MessageSquarePlus } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { formatDate } from "@/lib/leads";
import type { Conversation } from "@/lib/messages-db";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const v = await requireViewer("/messages");
  const [{ data }, branches] = await Promise.all([
    supabaseAdmin()!.from("conversations").select("*").eq("user_id", v.id).order("last_message_at", { ascending: false }).limit(100),
    getAllBranches(),
  ]);
  const list = (data ?? []) as Conversation[];
  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-extrabold md:text-4xl">Messages</h1>
        <div className="flex gap-2">
          {v.isStaff && (
            <Link href="/branch/messages" className="btn-dark"><Inbox size={18} aria-hidden /> Branch inbox</Link>
          )}
          <Link href="/messages/new" className="btn-primary"><MessageSquarePlus size={18} aria-hidden /> New message</Link>
        </div>
      </div>
      <p className="mt-2 text-muted">Ask about products, prices, your orders or deliveries. Your branch replies here.</p>
      {list.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-muted">No messages yet.</p>
      ) : (
        <ul className="mt-6 grid gap-2">
          {list.map((c) => {
            const unread = c.last_message_at > c.customer_read_at;
            const b = branches.find((x) => x.slug === c.branch_slug);
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
                  {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-red-deep" aria-label="Unread" />}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate ${unread ? "font-bold" : "font-semibold"}`}>{c.subject}</p>
                    <p className="text-sm text-muted">{b ? b.city : "Manager's Pizza"} · {formatDate(c.last_message_at, true)}{c.status === "closed" ? " · closed" : ""}</p>
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
