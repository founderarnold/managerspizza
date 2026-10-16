import { NextResponse } from "next/server";
import { supabaseSession } from "@/lib/supabase-session";

export async function POST(req: Request) {
  const sb = await supabaseSession();
  await sb?.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
