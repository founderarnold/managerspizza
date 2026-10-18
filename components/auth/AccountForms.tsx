"use client";

import { BUSINESS_TYPES } from "@/lib/site";
import { useActionState } from "react";
import { changePassword, updateProfile, type FormState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/dashboard/ui";
import type { Profile } from "@/lib/auth";
import { useBranches } from "@/components/BranchesProvider";

export function ProfileForm({ profile, next, defaultName }: { profile: Profile | null; next?: string; defaultName?: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, null);
  const branches = useBranches().filter((b) => b.status !== "opening_soon");
  const p = profile;
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {next && <input type="hidden" name="next" value={next} />}
      {!p && (
        <label className="label sm:col-span-2">
          Nearest branch
          <select className="field" name="branch" defaultValue="">
            <option value="">Not sure yet</option>
            {branches.map((b) => (
              <option key={b.slug} value={b.slug}>{b.city}, {b.province}</option>
            ))}
          </select>
        </label>
      )}
      <label className="label sm:col-span-2">
        Full name *
        <input className="field" name="name" required defaultValue={p?.full_name ?? defaultName ?? ""} autoComplete="name" />
      </label>
      <label className="label">
        Mobile number *
        <input className="field" name="mobile" required defaultValue={p?.mobile ?? ""} inputMode="tel" autoComplete="tel" />
      </label>
      <label className="label">
        Business name
        <input className="field" name="businessName" defaultValue={p?.business_name ?? ""} />
      </label>
      <label className="label">
        I am a
        <select className="field" name="businessType" defaultValue={p?.business_type ?? "new"}>
          {BUSINESS_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </label>
      <label className="label">
        Province
        <input className="field" name="province" defaultValue={p?.province ?? ""} />
      </label>
      <label className="label">
        City / municipality
        <input className="field" name="city" defaultValue={p?.city ?? ""} />
      </label>
      <label className="label">
        Barangay
        <input className="field" name="barangay" defaultValue={p?.barangay ?? ""} />
      </label>
      <label className="label sm:col-span-2">
        Delivery address
        <input className="field" name="address" defaultValue={p?.address ?? ""} autoComplete="street-address" />
      </label>
      <div className="grid gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <div>
          <SubmitButton>Save my details</SubmitButton>
        </div>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, null);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <label className="label">
        New password
        <input className="field" name="password" type="password" minLength={8} required autoComplete="new-password" />
      </label>
      <label className="label">
        Type it again
        <input className="field" name="password2" type="password" minLength={8} required autoComplete="new-password" />
      </label>
      <div className="grid gap-3 sm:col-span-2">
        <FormMessage state={state} />
        <div>
          <SubmitButton className="btn-ghost">Change password</SubmitButton>
        </div>
      </div>
    </form>
  );
}
