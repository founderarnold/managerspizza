import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { conversationRole, type Conversation } from "@/lib/messages-db";

export const dynamic = "force-dynamic";

/** New messages in a conversation after ?after=<message id>; marks the conversation read. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: c } = await db.from("conversations").select("*").eq("id", id).maybeSingle();
  const role = c ? conversationRole(v, c as Conversation) : null;
  if (!c || !role) return NextResponse.json({ error: "not found" }, { status: 404 });
  const after = Number(new URL(req.url).searchParams.get("after") ?? 0) || 0;
  const { data } = await db.from("messages").select("*").eq("conversation_id", id).gt("id", after).order("id").limit(200);
  await db.from("conversations").update(role === "staff" ? { staff_read_at: new Date().toISOString() } : { customer_read_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ messages: data ?? [], status: c.status }, { headers: { "cache-control": "no-store" } });
}
