"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "link";

const FRIENDLY: [RegExp, string][] = [
  [/invalid login credentials/i, "Wrong email or password. Try again, or use “Email me a sign-in link”."],
  [/email not confirmed/i, "Please open the confirmation email we sent you first, then sign in."],
  [/already registered/i, "This email already has an account. Sign in instead."],
  [/rate limit|security purposes/i, "Too many tries. Please wait a minute and try again."],
  [/password should be/i, "Use a password with at least 8 characters."],
];
const friendly = (m: string) => FRIENDLY.find(([re]) => re.test(m))?.[1] ?? m;

export function LoginForm({ next, initialMode = "signin" }: { next: string; initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const sb = supabaseBrowser();

  if (!sb)
    return <p className="rounded-xl bg-sand p-4 text-sm">Sign-in is not switched on for this website yet. Please call or text a branch.</p>;

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sb) return;
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      } else if (mode === "link") {
        const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo(), shouldCreateUser: false } });
        if (error) throw error;
        setSent(email);
      } else {
        if (password.length < 8) throw new Error("Password should be at least 8 characters.");
        const meta = Object.fromEntries(
          ["full_name", "mobile", "business_name", "business_type", "province", "city"].map((k) => [k, String(fd.get(k) ?? "").trim()]),
        );
        const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta, emailRedirectTo: redirectTo() } });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
        } else setSent(email);
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="text-center">
        <Mail size={36} className="mx-auto text-brand-red-deep" aria-hidden />
        <h2 className="mt-3 text-2xl font-bold">Check your email</h2>
        <p className="mt-2 text-graphite">
          We sent a link to <strong>{sent}</strong>. Open it on this phone or computer to {mode === "signup" ? "confirm your account" : "sign in"}.
          Check the Spam folder if you don&apos;t see it.
        </p>
        <button type="button" className="btn-ghost mt-5" onClick={() => setSent("")}>Back</button>
      </div>
    );

  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 rounded-full bg-sand p-1 text-sm font-semibold">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m || (m === "signin" && mode === "link")}
            onClick={() => { setMode(m); setError(""); }}
            className={`min-h-10 rounded-full transition ${mode === m || (m === "signin" && mode === "link") ? "bg-white shadow-soft" : "text-muted"}`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
        {mode === "signup" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="label sm:col-span-2">Full name *<input className="field" name="full_name" required autoComplete="name" /></label>
            <label className="label">Mobile number *<input className="field" name="mobile" required inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" /></label>
            <label className="label">Business name<input className="field" name="business_name" autoComplete="organization" /></label>
            <label className="label sm:col-span-2">
              I am a
              <select className="field" name="business_type" defaultValue="new">
                <option value="new">New entrepreneur</option>
                <option value="store">Existing pizza store</option>
                <option value="reseller">Reseller</option>
                <option value="distributor">Distributor</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="label">Province<input className="field" name="province" autoComplete="address-level1" /></label>
            <label className="label">City / municipality<input className="field" name="city" autoComplete="address-level2" /></label>
          </div>
        )}
        <label className="label">Email *<input className="field" name="email" type="email" required autoComplete="email" /></label>
        {mode !== "link" && (
          <label className="label">
            Password *
            <input className="field" name="password" type="password" required minLength={mode === "signup" ? 8 : undefined} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
            {mode === "signup" && <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>}
          </label>
        )}
        {error && <p role="alert" className="rounded-xl bg-brand-red-deep/10 p-3 text-sm text-brand-red-deep">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create my account" : "Email me a sign-in link"}
        </button>
        {mode === "signin" && (
          <button type="button" className="text-sm font-medium text-brand-red-deep underline" onClick={() => { setMode("link"); setError(""); }}>
            Forgot your password? Email me a sign-in link
          </button>
        )}
        {mode === "link" && (
          <button type="button" className="text-sm font-medium text-brand-red-deep underline" onClick={() => setMode("signin")}>
            Sign in with a password instead
          </button>
        )}
      </form>
    </div>
  );
}
