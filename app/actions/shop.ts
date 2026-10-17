"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getViewer, canSeeBranch } from "@/lib/auth";
import { getBranches } from "@/lib/branches-db";
import { priceSheets } from "@/lib/prices-db";
import { findVariant } from "@/lib/products";
import { DELIVERY_METHODS, ORDER_STATUSES, orderTotals, type OrderItem, type OrderStatus, type Payment } from "@/lib/orders";
import { conversationRole, type Conversation } from "@/lib/messages-db";
import { orderStatus } from "@/lib/orders";
import { alertCustomer, alertStaff, peso } from "@/lib/notify";
import { after as after_ } from "next/server";
import type { FormState } from "./auth";

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);
const PH_MOBILE = /^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/;
const DENIED: FormState = { error: "You don't have access to do that." };
const round2 = (n: number) => Math.round(n * 100) / 100;

function reference(prefix: string) {
  const d = new Date();
  const ymd = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  return `MP-${prefix}${ymd}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/** Places an order from the cart. Prices are recomputed here for the customer's level and branch. */
export async function placeOrder(_: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return { error: "Please sign in again." };
  const p = v.profile;
  if (p?.status !== "approved") return { error: "Your account must be approved before you can order." };

  let lines: { sheet: string; row: string; column: string; qty: number }[];
  try {
    lines = JSON.parse(String(fd.get("cart") ?? "[]"));
  } catch {
    return { error: "Your cart could not be read. Please refresh the page." };
  }
  const branch = str(fd, "branch", 60) || p.branch_slug || "";
  const method = str(fd, "delivery", 40);
  const address = str(fd, "address", 400);
  const name = str(fd, "name", 120);
  const mobile = str(fd, "mobile", 30);
  if (!(await getBranches()).some((b) => b.slug === branch && b.status === "open")) return { error: "Please choose the branch that will serve your order." };
  if (!DELIVERY_METHODS.some((d) => d.id === method)) return { error: "Please choose pickup or a delivery option." };
  if (method !== "pickup" && address.length < 8) return { error: "Please enter the complete delivery address." };
  if (!name) return { error: "Please enter the name of the person receiving the order." };
  if (!PH_MOBILE.test(mobile.replace(/\s+/g, " "))) return { error: "Please enter a Philippine mobile number, e.g. 0917 123 4567." };

  const sheets = await priceSheets(branch, p.tier);
  const items: OrderItem[] = [];
  for (const l of Array.isArray(lines) ? lines.slice(0, 200) : []) {
    const found = findVariant(String(l.sheet), String(l.row), String(l.column));
    const qty = Math.floor(Number(l.qty));
    if (!found || found.product.rfq || !(qty >= 1 && qty <= 100000)) continue;
    const sheet = sheets.find((s) => s.slug === found.product.sheet)!;
    const ci = sheet.columns.findIndex((c) => c.key === found.variant.column);
    const price = sheet.rows.find((r) => r.key === found.variant.row)?.prices[ci];
    if (price == null) return { error: `${found.product.name} (${found.variant.label}) is not available at this branch. Please remove it from your cart.` };
    items.push({
      sheet: found.product.sheet,
      row: found.variant.row,
      column: found.variant.column,
      name: found.product.name,
      option: [found.variant.label, found.variant.sub].filter(Boolean).join(" · "),
      unit: found.product.unit,
      qty,
      unit_price: price,
      line_total: round2(price * qty),
    });
  }
  if (!items.length) return { error: "Your cart is empty." };

  const ref = reference("O");
  const { data: order, error } = await db
    .from("orders")
    .insert({
      reference: ref,
      user_id: v.id,
      branch_slug: branch,
      tier: p.tier,
      items,
      subtotal: round2(items.reduce((s, i) => s + i.line_total, 0)),
      shipping_fee: method === "pickup" ? 0 : null,
      delivery_method: method,
      delivery_address: method === "pickup" ? null : address,
      contact_name: name,
      contact_mobile: mobile,
      notes: str(fd, "notes", 1000) || null,
    })
    .select("id")
    .single();
  if (error || !order) return { error: "We couldn't place your order. Please try again." };
  await db.from("order_events").insert({ order_id: order.id, status: "pending_payment", note: "Order placed", actor: v.id });
  const subtotal = round2(items.reduce((s, i) => s + i.line_total, 0));
  const branchName = (await getBranches()).find((b) => b.slug === branch)?.city ?? branch;
  const delivery = DELIVERY_METHODS.find((d) => d.id === method)!.label;
  after_(() =>
    Promise.all([
      alertCustomer(
        v.id,
        {
          subject: `Order ${ref} received: please pay ${peso(subtotal)}`,
          lines: [
            `Thank you, ${name}! We received your order ${ref}.`,
            `${items.length} item${items.length === 1 ? "" : "s"}, ${peso(subtotal)} · ${delivery} · ${branchName} branch`,
            "Pay by GCash, BDO, Maya or GoTyme and upload your payment screenshot. We prepare your order once the payment is confirmed.",
          ],
          link: { href: `/orders/${ref}/pay`, label: "Pay now" },
          sms: `Manager's Pizza: Order ${ref} received, ${peso(subtotal)}. Pay via GCash/BDO/Maya/GoTyme and upload the screenshot at managerspizza.com/orders`,
        },
        mobile,
      ),
      alertStaff(
        branch,
        {
          subject: `New order ${ref} · ${branchName} · ${peso(subtotal)}`,
          lines: [`New order from ${name}${p.business_name ? ` (${p.business_name})` : ""}, ${mobile}.`, `${items.length} items, ${peso(subtotal)} · ${delivery}`, "Waiting for the customer's payment."],
          link: { href: `/branch/orders/${order.id}`, label: "Open the order" },
          sms: `Manager's Pizza: New order ${ref} at ${branchName}, ${peso(subtotal)}, ${delivery}. Customer: ${name} ${mobile}`,
        },
        { sms: true },
      ),
    ]),
  );
  revalidatePath("/orders");
  redirect(`/orders/${ref}/pay?new=1`);
}

const PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Customer uploads a payment screenshot for an order. */
export async function submitPayment(orderId: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return { error: "Please sign in again." };
  const { data: o } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!o || o.user_id !== v.id) return DENIED;
  if (o.status === "cancelled") return { error: "This order was cancelled." };
  const method = str(fd, "method", 20);
  const amount = Number(str(fd, "amount", 20).replace(/[₱,\s]/g, ""));
  const file = fd.get("proof");
  const { data: pm } = await db.from("payment_methods").select("id").eq("id", method).eq("active", true).maybeSingle();
  if (!pm) return { error: "Please choose how you paid." };
  if (!(amount > 0)) return { error: "Please enter the amount you paid." };
  if (!(file instanceof File) || file.size === 0) return { error: "Please attach the screenshot of your payment." };
  if (file.size > 6 * 1024 * 1024) return { error: "The screenshot is too large. Please use a file under 6 MB." };
  if (file.type && !PROOF_TYPES.includes(file.type)) return { error: "Please upload a photo or screenshot (JPG or PNG)." };

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${o.reference}/${Date.now()}.${ext}`;
  const { error: upErr } = await db.storage.from("payment-proofs").upload(path, file, { contentType: file.type || "image/jpeg" });
  if (upErr) return { error: "We couldn't upload the screenshot. Please try again." };
  const { error } = await db.from("payments").insert({
    order_id: o.id,
    user_id: v.id,
    method,
    amount: round2(amount),
    reference: str(fd, "reference", 80) || null,
    proof_path: path,
  });
  if (error) return { error: "We couldn't save your payment. Please try again." };
  if (o.status === "pending_payment") {
    await db.from("orders").update({ status: "payment_review", updated_at: new Date().toISOString() }).eq("id", o.id);
    await db.from("order_events").insert({ order_id: o.id, status: "payment_review", note: `Payment screenshot uploaded (${method.toUpperCase()})`, actor: v.id });
  } else {
    await db.from("order_events").insert({ order_id: o.id, note: `Another payment screenshot uploaded (${method.toUpperCase()})`, actor: v.id });
  }
  after_(() =>
    alertStaff(
      o.branch_slug,
      {
        subject: `Payment to check: ${o.reference} · ${peso(round2(amount))} ${method.toUpperCase()}`,
        lines: [`${o.contact_name} uploaded a ${method.toUpperCase()} payment of ${peso(round2(amount))} for order ${o.reference}.`, "Check it against your account, then confirm it so the order can be prepared."],
        link: { href: `/branch/orders/${o.id}`, label: "Check the payment" },
        sms: `Manager's Pizza: Payment to check for ${o.reference}, ${peso(round2(amount))} via ${method.toUpperCase()}.`,
      },
      { sms: true },
    ),
  );
  revalidatePath(`/orders/${o.reference}`);
  redirect(`/orders/${o.reference}?paid=1`);
}

/** Staff: update an order's status, fees and delivery tracking. */
export async function updateOrder(orderId: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isStaff || !db) return DENIED;
  const { data: o } = await db.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!o || !canSeeBranch(v, o.branch_slug)) return DENIED;
  const status = str(fd, "status", 30) as OrderStatus;
  if (!ORDER_STATUSES.some((s) => s.id === status)) return { error: "Please choose a status." };
  const money = (k: string) => {
    const raw = str(fd, k, 20).replace(/[₱,\s]/g, "");
    return raw === "" ? null : Number(raw);
  };
  const shipping = money("shippingFee");
  const adjustment = money("adjustment") ?? 0;
  if (shipping != null && !(shipping >= 0)) return { error: "Please enter the shipping fee as a number." };
  if (!Number.isFinite(adjustment)) return { error: "Please enter the adjustment as a number (use - for a discount)." };
  const after = {
    status,
    shipping_fee: shipping,
    adjustment: round2(adjustment),
    adjustment_note: str(fd, "adjustmentNote", 300) || null,
    courier: str(fd, "courier", 80) || null,
    tracking_ref: str(fd, "trackingRef", 120) || null,
    tracking_url: /^https?:\/\//.test(str(fd, "trackingUrl", 400)) ? str(fd, "trackingUrl", 400) : null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from("orders").update(after).eq("id", o.id);
  if (error) return { error: "We couldn't save the order. Please try again." };
  const note = str(fd, "note", 1000);
  const changes: string[] = [];
  if (Number(o.shipping_fee ?? -1) !== Number(shipping ?? -1) && shipping != null) changes.push(`Shipping fee set to ₱${shipping.toLocaleString("en-PH")}`);
  if (Number(o.adjustment) !== round2(adjustment)) changes.push(`Adjustment ₱${adjustment.toLocaleString("en-PH")}${after.adjustment_note ? ` (${after.adjustment_note})` : ""}`);
  if (after.tracking_ref && after.tracking_ref !== o.tracking_ref) changes.push(`Tracking: ${after.courier ?? ""} ${after.tracking_ref}`.trim());
  if (status !== o.status || note || changes.length) {
    await db.from("order_events").insert({ order_id: o.id, status: status !== o.status ? status : null, note: [note, ...changes].filter(Boolean).join(" · ") || null, actor: v.id });
    const s = orderStatus(status);
    const t = orderTotals({ ...o, ...after }, ((await db.from("payments").select("amount,status").eq("order_id", o.id)).data ?? []) as Pick<Payment, "amount" | "status">[]);
    after_(() =>
      alertCustomer(
        o.user_id,
        {
          subject: status !== o.status ? `Order ${o.reference}: ${s.label}` : `Update on order ${o.reference}`,
          lines: [
            status !== o.status ? s.customer : `There's an update on your order ${o.reference}.`,
            ...[note, ...changes].filter(Boolean),
            ...(t.balance > 0 && status !== "cancelled" && (shipping != null || adjustment !== 0) ? [`Amount still to pay: ${peso(t.balance)}`] : []),
          ],
          link: { href: t.balance > 0 && status !== "cancelled" ? `/orders/${o.reference}/pay` : `/orders/${o.reference}`, label: t.balance > 0 && status !== "cancelled" ? "Pay the balance" : "Track your order" },
          sms: `Manager's Pizza: Order ${o.reference} - ${status !== o.status ? s.label : "update"}.${note ? ` ${note}` : ""}${after.tracking_ref ? ` Tracking: ${after.courier ?? ""} ${after.tracking_ref}.` : ""}`,
        },
        o.contact_mobile,
      ),
    );
  }
  revalidatePath(`/branch/orders/${o.id}`);
  revalidatePath(`/orders/${o.reference}`);
  return { ok: "Saved. The customer sees the update on their order page." };
}

/** Staff: confirm or reject a payment screenshot. */
export async function reviewPayment(paymentId: string, decision: "confirmed" | "rejected", _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isStaff || !db) return DENIED;
  const { data: pay } = await db.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (!pay) return DENIED;
  const { data: o } = await db.from("orders").select("*").eq("id", pay.order_id).maybeSingle();
  if (!o || !canSeeBranch(v, o.branch_slug)) return DENIED;
  const note = str(fd, "note", 500) || null;
  if (decision === "rejected" && !note) return { error: "Please tell the customer why the payment was not accepted." };
  await db.from("payments").update({ status: decision, review_note: note, reviewed_by: v.id, reviewed_at: new Date().toISOString() }).eq("id", paymentId);

  const { data: all } = await db.from("payments").select("amount,status").eq("order_id", o.id);
  const t = orderTotals(o, (all ?? []) as Pick<Payment, "amount" | "status">[]);
  let status: OrderStatus = o.status;
  if (decision === "confirmed" && t.balance <= 0 && ["pending_payment", "payment_review"].includes(o.status)) status = "paid";
  if (decision === "rejected" && o.status === "payment_review" && t.pending === 0) status = "pending_payment";
  if (status !== o.status) await db.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", o.id);
  await db.from("order_events").insert({
    order_id: o.id,
    status: status !== o.status ? status : null,
    note: decision === "confirmed" ? `Payment of ₱${Number(pay.amount).toLocaleString("en-PH")} confirmed${t.balance > 0 ? `. Balance ₱${t.balance.toLocaleString("en-PH")}` : ""}` : `Payment not accepted: ${note}`,
    actor: v.id,
  });
  after_(() =>
    alertCustomer(
      o.user_id,
      decision === "confirmed"
        ? {
            subject: `Payment confirmed for order ${o.reference}`,
            lines: [`We received your payment of ${peso(Number(pay.amount))}.`, t.balance > 0 ? `Balance still to pay: ${peso(t.balance)}.` : "Your order is fully paid. The branch will now prepare it."],
            link: { href: t.balance > 0 ? `/orders/${o.reference}/pay` : `/orders/${o.reference}`, label: t.balance > 0 ? "Pay the balance" : "Track your order" },
            sms: `Manager's Pizza: Payment of ${peso(Number(pay.amount))} for order ${o.reference} confirmed.${t.balance > 0 ? ` Balance ${peso(t.balance)}.` : " We'll prepare your order."}`,
          }
        : {
            subject: `Payment not received for order ${o.reference}`,
            lines: [`We could not confirm your payment of ${peso(Number(pay.amount))}.`, `Reason: ${note}`, "Please check and upload your payment again, or message the branch."],
            link: { href: `/orders/${o.reference}/pay`, label: "Upload payment again" },
            sms: `Manager's Pizza: Payment for order ${o.reference} not confirmed: ${note}. Please re-upload at managerspizza.com/orders`,
          },
      o.contact_mobile,
    ),
  );
  revalidatePath(`/branch/orders/${o.id}`);
  revalidatePath(`/orders/${o.reference}`);
  return { ok: decision === "confirmed" ? "Payment confirmed." : "Payment marked as not accepted. The customer was asked to pay again." };
}

/** Admin: payment method details and QR code. */
export async function savePaymentMethod(id: string, _: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v?.isAdmin || !db) return DENIED;
  const row: Record<string, unknown> = {
    account_name: str(fd, "accountName", 120) || null,
    account_number: str(fd, "accountNumber", 60) || null,
    instructions: str(fd, "instructions", 500) || null,
    active: fd.get("active") === "on",
  };
  const file = fd.get("qr");
  if (file instanceof File && file.size > 0) {
    if (file.size > 4 * 1024 * 1024) return { error: "The QR image is too large. Please use a file under 4 MB." };
    if (file.type && !PROOF_TYPES.includes(file.type)) return { error: "Please upload the QR code as a JPG or PNG image." };
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${id}-${Date.now()}.${ext}`;
    const { error } = await db.storage.from("payment-qr").upload(path, file, { contentType: file.type || "image/png", upsert: true });
    if (error) return { error: "We couldn't upload the QR code. Please try again." };
    row.qr_path = path;
  }
  const { error } = await db.from("payment_methods").update(row).eq("id", id);
  if (error) return { error: "We couldn't save this payment method." };
  revalidatePath("/orders", "layout");
  revalidatePath("/admin");
  return { ok: "Saved." };
}

/** Customer or staff: start a conversation. */
export async function startConversation(_: FormState, fd: FormData): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return { error: "Please sign in again." };
  const body = str(fd, "body", 4000);
  let subject = str(fd, "subject", 140);
  let branch = str(fd, "branch", 60) || v.profile?.branch_slug || null;
  let orderId: string | null = null;
  const orderRef = str(fd, "order", 40);
  if (orderRef) {
    const { data: o } = await db.from("orders").select("id,reference,branch_slug,user_id").eq("reference", orderRef).maybeSingle();
    if (!o || o.user_id !== v.id) return DENIED;
    orderId = o.id;
    branch = o.branch_slug;
    subject = subject || `Order ${o.reference}`;
  }
  if (!subject) return { error: "Please add a subject, e.g. \"Price of 12-inch boxes\"." };
  if (!body) return { error: "Please write your message." };
  if (branch && !(await getBranches()).some((b) => b.slug === branch)) branch = null;
  const now = new Date().toISOString();
  const { data: c, error } = await db
    .from("conversations")
    .insert({ user_id: v.id, branch_slug: branch, order_id: orderId, subject, last_message_at: now, customer_read_at: now })
    .select("id")
    .single();
  if (error || !c) return { error: "We couldn't send your message. Please try again." };
  await db.from("messages").insert({ conversation_id: c.id, sender_id: v.id, from_staff: false, body });
  const who = v.profile?.full_name ?? v.email;
  after_(() =>
    alertStaff(branch, {
      subject: `New message: ${subject}`,
      lines: [`${who}${v.profile?.business_name ? ` (${v.profile.business_name})` : ""} sent a message:`, body.length > 400 ? `${body.slice(0, 400)}…` : body],
      link: { href: `/messages/${c.id}`, label: "Reply" },
    }),
  );
  redirect(`/messages/${c.id}`);
}

/** Send a message in a conversation (customer or staff). */
export async function sendMessage(conversationId: string, body: string): Promise<FormState> {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return { error: "Please sign in again." };
  const text = body.trim().slice(0, 4000);
  if (!text) return { error: "Please write a message." };
  const { data: c } = await db.from("conversations").select("*").eq("id", conversationId).maybeSingle();
  const role = c ? conversationRole(v, c as Conversation) : null;
  if (!c || !role) return DENIED;
  const now = new Date().toISOString();
  // Email the other side once per burst: skip if this side already wrote in the last 10 minutes.
  const { data: prev } = await db.from("messages").select("from_staff,created_at").eq("conversation_id", c.id).order("id", { ascending: false }).limit(1).maybeSingle();
  const burst = prev && prev.from_staff === (role === "staff") && Date.now() - new Date(prev.created_at).getTime() < 10 * 60 * 1000;
  const { error } = await db.from("messages").insert({ conversation_id: c.id, sender_id: v.id, from_staff: role === "staff", body: text });
  if (error) return { error: "Message not sent. Please try again." };
  if (!burst) {
    const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    after_(() =>
      role === "staff"
        ? alertCustomer(c.user_id, {
            subject: `Manager's Pizza replied: ${c.subject}`,
            lines: ["You have a new reply from Manager's Pizza:", preview],
            link: { href: `/messages/${c.id}`, label: "Open the conversation" },
            sms: `Manager's Pizza replied to "${c.subject.slice(0, 60)}". Read it at managerspizza.com/messages`,
          })
        : alertStaff(c.branch_slug, {
            subject: `New message: ${c.subject}`,
            lines: [`${v.profile?.full_name ?? v.email} wrote:`, preview],
            link: { href: `/messages/${c.id}`, label: "Reply" },
          }),
    );
  }
  await db
    .from("conversations")
    .update({ last_message_at: now, status: "open", ...(role === "staff" ? { staff_read_at: now } : { customer_read_at: now }) })
    .eq("id", c.id);
  return { ok: "sent" };
}

/** Staff: close or reopen a conversation. */
export async function setConversationStatus(conversationId: string, status: "open" | "closed") {
  const v = await getViewer();
  const db = supabaseAdmin();
  if (!v || !db) return;
  const { data: c } = await db.from("conversations").select("*").eq("id", conversationId).maybeSingle();
  if (!c || conversationRole(v, c as Conversation) !== "staff") return;
  await db.from("conversations").update({ status }).eq("id", c.id);
  revalidatePath(`/messages/${c.id}`);
}
