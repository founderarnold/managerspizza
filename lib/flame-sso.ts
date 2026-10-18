import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * One FLAME PH account across the ecosystem (flameph.org, NegosyoDepot, MarketplacePH, Manager's Pizza), with
 * flameph.org as the hub. Visitors signed in on flameph.org are signed in here automatically, and signing in here
 * signs them in on flameph.org too. Messages are short-lived tokens signed with SSO_SECRET, which the hub knows as
 * SSO_SECRET_MANAGERSPIZZA. Accounts are matched by verified email. Everything is off until SSO_SECRET is set.
 */

export const SSO_CLIENT = "managerspizza";
export const SSO_HUB = "flameph";
export const HUB_URL = "https://www.flameph.org";
/** "checked" for a while after asking the hub (no repeat checks), "off" after logging out. */
export const SSO_COOKIE = "flame_sso";

type Claims = { iss: string; aud: string; email: string; name?: string; iat: number; exp: number };

const secret = () => {
  const s = process.env.SSO_SECRET;
  return s && s.length >= 32 ? s : null;
};
export const ssoEnabled = () => secret() !== null;

const mac = (key: string, data: string) => createHmac("sha256", key).update(data).digest();

export function signToken(email: string, name?: string, ttlSeconds = 120): string | null {
  const key = secret();
  if (!key) return null;
  const now = Math.floor(Date.now() / 1000);
  const body = Buffer.from(JSON.stringify({ iss: SSO_CLIENT, aud: SSO_HUB, email: email.toLowerCase(), name, iat: now, exp: now + ttlSeconds })).toString("base64url");
  return `v1.${body}.${mac(key, body).toString("base64url")}`;
}

export function verifyToken(token: string): Claims | null {
  const key = secret();
  const [v, body, sig] = token.split(".");
  if (!key || v !== "v1" || !body || !sig) return null;
  const want = mac(key, body);
  const got = Buffer.from(sig, "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString()) as Claims;
    const now = Math.floor(Date.now() / 1000);
    if (c.iss !== SSO_HUB || c.aud !== SSO_CLIENT || !(c.exp > now) || c.iat > now + 30) return null;
    if (typeof c.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return null;
    return c;
  } catch {
    return null;
  }
}

/** Signs the visitor in as the account with this verified email, creating the sign-in if needed. */
export async function signInByEmail(admin: SupabaseClient, session: SupabaseClient, email: string, name?: string): Promise<{ ok: boolean; created: boolean }> {
  const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: name ? { full_name: name } : {} });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) return { ok: false, created: false };
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = link.data?.properties?.hashed_token;
  if (link.error || !hash) return { ok: false, created: false };
  const { data, error } = await session.auth.verifyOtp({ token_hash: hash, type: "magiclink" });
  if (error || !data.user) return { ok: false, created: false };
  // The hub proved this email. If the account here was made with a password and never verified, whoever chose that
  // password may not own the email, so the password is replaced (the owner can set a new one under My account).
  const meta = data.user.app_metadata ?? {};
  if (meta.email_unverified || !meta.flame_verified)
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { ...meta, email_unverified: false, flame_verified: true },
      ...(meta.email_unverified ? { password: randomBytes(24).toString("base64url") } : {}),
    });
  return { ok: true, created: !created.error };
}

/**
 * Only emails proven by the hub are passed on to other FLAME PH sites. Accounts made here with a password (email not
 * checked) are not, until they sign in once with their FLAME PH account.
 */
export const emailProven = (appMeta: Record<string, unknown> | undefined) => appMeta?.flame_verified === true && !appMeta?.email_unverified;

/** The hub's sign-in page for this site (non-silent): it shows the FLAME PH login (email or Google) if needed. */
export const hubLoginUrl = (returnTo: string) => `${HUB_URL}/sso/authorize?client=${SSO_CLIENT}&return=${encodeURIComponent(returnTo)}`;
