import { NextResponse, type NextRequest } from "next/server";
import { SSO_COOKIE, signInByEmail, verifyToken } from "@/lib/flame-sso";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-server";

const safe = (p: string) => (p.startsWith("/") && !p.startsWith("//") ? p : "/");

/** flameph.org sends visitors back here with a signed token (signed in there) or error=login_required. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const origin = request.nextUrl.origin;
  let next = "/";
  try {
    const u = new URL(sp.get("next") ?? "/", origin);
    if (u.origin === origin) next = safe(u.pathname + u.search);
  } catch {}

  const token = sp.get("token");
  const claims = token ? verifyToken(token) : null;
  if (claims) {
    const supabase = await supabaseServer();
    const admin = supabaseAdmin();
    if (supabase && admin) {
      const current = (await supabase.auth.getUser()).data.user;
      if (current?.email?.toLowerCase() !== claims.email) {
        const { ok } = await signInByEmail(admin, supabase, claims.email, claims.name);
        if (!ok) console.error("auth/flame: could not sign in");
      }
      // First visit with a FLAME PH account: ask for the business details Manager's Pizza needs.
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const { data: profile } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
        if (!profile) next = `/account/complete?next=${encodeURIComponent(next)}`;
      }
    }
  }
  const res = NextResponse.redirect(`${origin}${next}`, { headers: { "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" } });
  if (!claims) res.cookies.set(SSO_COOKIE, "checked", { maxAge: 60 * 60 * 6, path: "/", sameSite: "lax", secure: true, httpOnly: true });
  return res;
}
