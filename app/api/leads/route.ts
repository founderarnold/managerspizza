import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { supabaseSession } from "@/lib/supabase-session";

const KINDS = ["quote", "consultation", "trial", "partner"] as const;
type Kind = (typeof KINDS)[number];

function reference(kind: Kind) {
  const prefix = { quote: "Q", consultation: "C", trial: "T", partner: "P" }[kind];
  const d = new Date();
  const ymd = `${d.getUTCFullYear() % 100}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MP-${prefix}${ymd}-${rand}`;
}

const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const kind = body.kind as Kind;
  if (!KINDS.includes(kind)) return NextResponse.json({ error: "Unknown form." }, { status: 400 });

  const name = str(body.name, 120);
  const mobile = str(body.mobile, 30);
  const email = str(body.email, 160);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 422 });
  if (!/^(\+?63|0)9\d{2}[\s-]?\d{3}[\s-]?\d{4}$/.test(mobile.replace(/\s+/g, " ")))
    return NextResponse.json({ error: "Please enter a Philippine mobile number, e.g. 0917 123 4567." }, { status: 422 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Please check your email address." }, { status: 422 });
  if (body.consent !== true)
    return NextResponse.json({ error: "Please agree to be contacted about this request." }, { status: 422 });

  const items = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  const details = typeof body.details === "object" && body.details ? body.details : {};
  const ref = reference(kind);

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ref, saved: false });

  // Link the request to the signed-in account, if any, so it shows on their dashboard.
  const session = await supabaseSession();
  const userId = session ? (await session.auth.getUser()).data.user?.id ?? null : null;

  const { error } = await db.from("leads").insert({
    ...(userId ? { user_id: userId } : {}),
    reference: ref,
    kind,
    name,
    mobile,
    email: email || null,
    business_type: str(body.businessType, 60) || null,
    province: str(body.province, 80) || null,
    city: str(body.city, 80) || null,
    barangay: str(body.barangay, 80) || null,
    address: str(body.address, 300) || null,
    branch_slug: str(body.branch, 60) || null,
    fulfillment: str(body.fulfillment, 40) || null,
    notes: str(body.notes, 2000) || null,
    items,
    details,
    marketing_consent: body.marketing === true,
  });
  if (error) {
    console.error("lead insert failed", error.message);
    return NextResponse.json({ ref, saved: false });
  }
  return NextResponse.json({ ref, saved: true });
}
