import "server-only";
import { supabaseAdmin } from "./supabase-server";
import type { Order, OrderEvent, Payment, PaymentMethod } from "./orders";

export async function paymentMethods(activeOnly = true) {
  const db = supabaseAdmin()!;
  let q = db.from("payment_methods").select("*").order("sort");
  if (activeOnly) q = q.eq("active", true);
  const { data } = await q;
  return ((data ?? []) as PaymentMethod[]).map((m) => ({
    ...m,
    qrUrl: m.qr_path ? db.storage.from("payment-qr").getPublicUrl(m.qr_path).data.publicUrl : null,
  }));
}

/** An order with its timeline and payments. */
export async function loadOrder(by: { id?: string; reference?: string }) {
  const db = supabaseAdmin()!;
  let q = db.from("orders").select("*");
  q = by.id ? q.eq("id", by.id) : q.eq("reference", by.reference ?? "");
  const { data } = await q.maybeSingle();
  if (!data) return null;
  const order = data as Order;
  const [{ data: events }, { data: payments }] = await Promise.all([
    db.from("order_events").select("*").eq("order_id", order.id).order("created_at"),
    db.from("payments").select("*").eq("order_id", order.id).order("created_at"),
  ]);
  return { order, events: (events ?? []) as OrderEvent[], payments: (payments ?? []) as Payment[] };
}

/** Short-lived links to view payment screenshots (staff only). */
export async function proofLinks(payments: Payment[]) {
  const db = supabaseAdmin()!;
  const out: Record<string, string> = {};
  await Promise.all(
    payments.map(async (p) => {
      const { data } = await db.storage.from("payment-proofs").createSignedUrl(p.proof_path, 60 * 30);
      if (data?.signedUrl) out[p.id] = data.signedUrl;
    }),
  );
  return out;
}
