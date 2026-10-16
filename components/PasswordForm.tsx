"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export function PasswordForm() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    if (password.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    const sb = supabaseBrowser();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.updateUser({ password });
    setBusy(false);
    if (error) setMsg({ ok: false, text: error.message });
    else {
      form.reset();
      setMsg({ ok: true, text: "Password saved." });
    }
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="label">
        New password
        <input className="field" name="password" type="password" minLength={8} required autoComplete="new-password" />
      </label>
      {msg && <p role="status" className={`text-sm font-medium ${msg.ok ? "text-success" : "text-brand-red-deep"}`}>{msg.text}</p>}
      <button className="btn-ghost justify-self-start" disabled={busy}>Save password</button>
    </form>
  );
}
