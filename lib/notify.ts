import "server-only";
import { supabaseAdmin } from "./supabase-server";
import { SITE } from "./site";

/**
 * Customer and staff alerts.
 * Email: Resend (RESEND_API_KEY, optional EMAIL_FROM). SMS: Semaphore, a Philippine SMS gateway
 * (SEMAPHORE_API_KEY, optional SEMAPHORE_SENDER). Each channel is skipped quietly while its key is
 * not set, and a failed alert never blocks an order, payment or message.
 */

const FROM = process.env.EMAIL_FROM || "Manager's Pizza <orders@managerspizza.com>";

export interface Alert {
  subject: string;
  /** Short lines of text; the first is the headline. */
  lines: string[];
  /** Button link (path on the site or full URL) and its label. */
  link?: { href: string; label: string };
  /** One-line SMS text (160 characters is one SMS). */
  sms?: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const abs = (href: string) => (href.startsWith("http") ? href : `${SITE.url}${href}`);

function html(a: Alert) {
  const [head, ...rest] = a.lines;
  return `<!doctype html><html><body style="margin:0;background:#fff8ec;font-family:Arial,Helvetica,sans-serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e7e2d8;border-radius:16px">
<tr><td style="background:#ffb20f;border-radius:16px 16px 0 0;padding:16px 24px;font-weight:bold;font-size:18px">Manager's Pizza</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:18px;font-weight:bold">${esc(head)}</p>
${rest.map((l) => `<p style="margin:0 0 10px;font-size:15px;line-height:1.5;color:#3a3a3a">${esc(l)}</p>`).join("")}
${a.link ? `<p style="margin:20px 0 0"><a href="${abs(a.link.href)}" style="display:inline-block;background:#b80000;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:999px">${esc(a.link.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e7e2d8;font-size:12px;color:#5e5e5e">${esc(SITE.address)} · ${esc(SITE.phones.join(" / "))}<br>You get this because you have an account on managerspizza.com.</td></tr>
</table></td></tr></table></body></html>`;
}

async function sendEmail(to: string[], a: Alert) {
  const key = process.env.RESEND_API_KEY;
  const list = [...new Set(to.filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];
  if (!key || !list.length) return;
  // One email per recipient so customers never see each other's addresses.
  await Promise.all(
    list.map((email) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: a.subject,
          html: html(a),
          text: [...a.lines, a.link ? `${a.link.label}: ${abs(a.link.href)}` : ""].filter(Boolean).join("\n\n"),
        }),
      }).catch(() => undefined),
    ),
  );
}

/** 09171234567 / +639171234567 / 0917 123 4567 → 09171234567 */
const phMobile = (m: string) => {
  const d = m.replace(/\D/g, "");
  if (/^639\d{9}$/.test(d)) return `0${d.slice(2)}`;
  if (/^09\d{9}$/.test(d)) return d;
  return null;
};

async function sendSms(to: string[], text: string) {
  const key = process.env.SEMAPHORE_API_KEY;
  const numbers = [...new Set(to.map(phMobile).filter((n): n is string => !!n))];
  if (!key || !numbers.length || !text) return;
  const body = new URLSearchParams({ apikey: key, number: numbers.join(","), message: text.slice(0, 300) });
  if (process.env.SEMAPHORE_SENDER) body.set("sendername", process.env.SEMAPHORE_SENDER);
  await fetch("https://api.semaphore.co/api/v4/messages", { method: "POST", body }).catch(() => undefined);
}

/** Alert one customer (by user id): email to their account email, SMS to their mobile. */
export async function alertCustomer(userId: string, a: Alert, extraMobile?: string | null) {
  try {
    const db = supabaseAdmin();
    if (!db) return;
    const { data: p } = await db.from("profiles").select("email,mobile").eq("id", userId).maybeSingle();
    await Promise.all([sendEmail(p?.email ? [p.email] : [], a), a.sms ? sendSms([p?.mobile, extraMobile].filter((x): x is string => !!x), a.sms) : undefined]);
  } catch {}
}

/** Alert someone by email / mobile directly (e.g. a quotation request sent without an account). */
export async function alertContact(email: string | null | undefined, mobile: string | null | undefined, a: Alert) {
  try {
    await Promise.all([sendEmail(email ? [email] : [], a), a.sms && mobile ? sendSms([mobile], a.sms) : undefined]);
  } catch {}
}

/** Alert the staff of a branch (OIC and staff) plus the admins. */
export async function alertStaff(branch: string | null, a: Alert, { sms = false }: { sms?: boolean } = {}) {
  try {
    const db = supabaseAdmin();
    if (!db) return;
    const { data: roles } = await db.from("staff_roles").select("user_id,role,branch_slug");
    const ids = new Set<string>();
    for (const r of roles ?? []) {
      if (["founder", "super_admin", "admin"].includes(r.role)) ids.add(r.user_id);
      else if (branch && r.branch_slug === branch && ["branch_oic", "staff"].includes(r.role)) ids.add(r.user_id);
    }
    const { data: people } = ids.size ? await db.from("profiles").select("email,mobile").in("id", [...ids]) : { data: [] };
    const emails = [...(people ?? []).map((p) => p.email as string), ...(process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim())].filter(Boolean);
    const mobiles = sms ? (people ?? []).map((p) => p.mobile as string).filter(Boolean) : [];
    await Promise.all([sendEmail(emails, a), sms && a.sms ? sendSms(mobiles, a.sms) : undefined]);
  } catch {}
}

export const peso = (n: number) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
