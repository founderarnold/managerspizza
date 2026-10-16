import { NextResponse } from "next/server";
import { supabaseSession } from "@/lib/supabase-session";

/** Email links (confirm account, sign-in link) land here and start the session. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const n = url.searchParams.get("next") ?? "/account";
  const next = n.startsWith("/") && !n.startsWith("//") ? n : "/account";
  const sb = await supabaseSession();
  if (code && sb) {
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
