import "server-only";
import { supabaseAdmin } from "./supabase-server";
import type { Viewer } from "./auth";

export interface Conversation {
  id: string;
  user_id: string;
  branch_slug: string | null;
  order_id: string | null;
  subject: string;
  status: "open" | "closed";
  last_message_at: string;
  customer_read_at: string;
  staff_read_at: string;
  created_at: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  sender_id: string | null;
  from_staff: boolean;
  body: string;
  created_at: string;
}

/** Conversations in a staff member's inbox: their branches, or every one for admins. */
export async function staffConversations(v: Viewer, limit = 200) {
  const db = supabaseAdmin()!;
  let q = db.from("conversations").select("*").order("last_message_at", { ascending: false }).limit(limit);
  if (!v.isAdmin) q = q.in("branch_slug", v.staffBranches ?? []);
  const { data } = await q;
  return ((data ?? []) as Conversation[]).filter((c) => c.user_id !== v.id);
}

/** Unread conversations: as a customer, plus (for staff) the ones waiting in their inbox. */
export async function unreadCount(v: Viewer) {
  const db = supabaseAdmin();
  if (!db) return 0;
  const { data: mine } = await db.from("conversations").select("last_message_at,customer_read_at").eq("user_id", v.id);
  let n = (mine ?? []).filter((c) => c.last_message_at > c.customer_read_at).length;
  if (v.isStaff) n += (await staffConversations(v, 500)).filter((c) => c.status === "open" && c.last_message_at > c.staff_read_at).length;
  return n;
}

/** Whether the viewer may read a conversation, and from which side. */
export function conversationRole(v: Viewer, c: Conversation): "customer" | "staff" | null {
  if (c.user_id === v.id) return "customer";
  if (v.isAdmin) return "staff";
  if (c.branch_slug && (v.staffBranches ?? []).includes(c.branch_slug)) return "staff";
  return null;
}
