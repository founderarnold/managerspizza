import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SESSION_PATHS = /^\/(account|admin|branch|login|register|checkout|orders|messages|api\/leads|api\/me|api\/messages)(\/|$)/;
const LIVE_HOSTS = new Set(["www.managerspizza.com", "managerspizza.com"]);
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|lighthouse/i;

/**
 * One FLAME PH account: a visitor who isn't signed in here is checked once with flameph.org, which signs them in
 * here if they're signed in there (see lib/flame-sso.ts). The flame_sso cookie stops repeat checks for a few hours
 * and stays "off" after they log out. Pages that need the signed-in user also get their session cookie refreshed.
 */
export async function middleware(request: NextRequest) {
  const signedIn = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  if (!signedIn && wantsSsoCheck(request)) {
    const res = NextResponse.redirect(
      `https://www.flameph.org/sso/authorize?client=managerspizza&silent=1&return=${encodeURIComponent(request.nextUrl.href)}`,
    );
    res.cookies.set("flame_sso", "checked", { maxAge: 60 * 60 * 6, path: "/", sameSite: "lax", secure: true, httpOnly: true });
    return res;
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !SESSION_PATHS.test(request.nextUrl.pathname)) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

function wantsSsoCheck(request: NextRequest) {
  const secret = process.env.SSO_SECRET;
  return (
    !!secret &&
    secret.length >= 32 &&
    request.method === "GET" &&
    LIVE_HOSTS.has(request.nextUrl.hostname) &&
    !request.cookies.has("flame_sso") &&
    !request.nextUrl.pathname.startsWith("/auth/") &&
    !request.nextUrl.pathname.startsWith("/api/") &&
    (request.headers.get("accept") ?? "").includes("text/html") &&
    !request.headers.has("next-router-prefetch") &&
    !request.headers.has("rsc") &&
    !BOT.test(request.headers.get("user-agent") ?? "")
  );
}

export const config = {
  // Every page and the API routes that need the session; not Next.js assets, images or files.
  matcher: ["/((?!_next/|favicon|icon|apple-touch|og\\.png|brand/|sw\\.js|manifest|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|js|css|txt|xml|json|woff2?)$).*)"],
};
