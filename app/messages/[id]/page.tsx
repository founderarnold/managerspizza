import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Package, Phone } from "lucide-react";
import { requireViewer } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { conversationRole, type Conversation, type Message } from "@/lib/messages-db";
import { setConversationStatus } from "@/app/actions/shop";
import { ChatView } from "@/components/messages/ChatView";

export const metadata: Metadata = { title: "Conversation", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await requireViewer(`/messages/${id}`);
  const db = supabaseAdmin()!;
  const { data } = await db.from("conversations").select("*").eq("id", id).maybeSingle();
  const c = data as Conversation | null;
  const side = c ? conversationRole(v, c) : null;
  if (!c || !side) notFound();
  const [{ data: msgs }, branches, { data: customer }, { data: order }] = await Promise.all([
    db.from("messages").select("*").eq("conversation_id", id).order("id").limit(500),
    getAllBranches(),
    side === "staff" ? db.from("profiles").select("full_name,mobile,business_name").eq("id", c.user_id).maybeSingle() : Promise.resolve({ data: null }),
    c.order_id ? db.from("orders").select("id,reference").eq("id", c.order_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  await db.from("conversations").update(side === "staff" ? { staff_read_at: new Date().toISOString() } : { customer_read_at: new Date().toISOString() }).eq("id", id);
  const branch = branches.find((b) => b.slug === c.branch_slug);

  return (
    <div className="container-x pb-24 pt-4 md:pb-16 md:pt-8">
      <Link href={side === "staff" ? "/branch/messages" : "/messages"} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> {side === "staff" ? "Branch inbox" : "Messages"}
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold">{c.subject}</h1>
          <p className="text-sm text-muted">
            {side === "staff" && customer ? `${customer.full_name}${customer.business_name ? ` · ${customer.business_name}` : ""} · ` : ""}
            {branch ? `${branch.city} branch` : "Head office"}
            {c.status === "closed" ? " · closed" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order && (
            <Link href={side === "staff" ? `/branch/orders/${order.id}` : `/orders/${order.reference}`} className="btn-ghost !min-h-10 !py-2 text-sm">
              <Package size={16} aria-hidden /> {order.reference}
            </Link>
          )}
          {side === "staff" && customer && (
            <a href={`tel:${customer.mobile.replace(/\s+/g, "")}`} className="btn-ghost !min-h-10 !py-2 text-sm"><Phone size={16} aria-hidden /> Call</a>
          )}
          {side === "staff" && (
            <form action={setConversationStatus.bind(null, c.id, c.status === "open" ? "closed" : "open")}>
              <button className="btn-ghost !min-h-10 !py-2 text-sm" type="submit">{c.status === "open" ? "Mark as done" : "Reopen"}</button>
            </form>
          )}
        </div>
      </div>
      <div className="mt-4">
        <ChatView conversationId={c.id} initial={(msgs ?? []) as Message[]} side={side} />
      </div>
    </div>
  );
}
