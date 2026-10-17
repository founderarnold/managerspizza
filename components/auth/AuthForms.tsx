"use client";

import { BUSINESS_TYPES } from "@/lib/site";
import Link from "next/link";
import { useActionState } from "react";
import { register, signIn, type FormState } from "@/app/actions/auth";
import { useBranches } from "@/components/BranchesProvider";
import { FormMessage, SubmitButton } from "@/components/dashboard/ui";

export function SignInForm({ next }: { next: string }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="label">
        Email
        <input className="field" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="label">
        Password
        <input className="field" name="password" type="password" autoComplete="current-password" required />
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full">Sign in</SubmitButton>
      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href={`/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-red-deep underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const BRANCHES = useBranches();
  const [state, action] = useActionState<FormState, FormData>(register, null);
  return (
    <form action={action} className="grid gap-5">
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-bold">Your details</legend>
        <label className="label sm:col-span-2">
          Full name *
          <input className="field" name="name" required autoComplete="name" />
        </label>
        <label className="label">
          Mobile number *
          <input className="field" name="mobile" required inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" />
        </label>
        <label className="label">
          Email *
          <input className="field" name="email" type="email" required autoComplete="email" />
        </label>
        <label className="label">
          Password * <span className="font-normal text-muted">(at least 8 characters)</span>
          <input className="field" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <label className="label">
          Type the password again *
          <input className="field" name="password2" type="password" required minLength={8} autoComplete="new-password" />
        </label>
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-bold">Your business</legend>
        <label className="label">
          Business name
          <input className="field" name="businessName" autoComplete="organization" />
        </label>
        <label className="label">
          I am a
          <select className="field" name="businessType" defaultValue="new">
            {BUSINESS_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Province
          <input className="field" name="province" autoComplete="address-level1" />
        </label>
        <label className="label">
          City / municipality
          <input className="field" name="city" autoComplete="address-level2" />
        </label>
        <label className="label">
          Barangay
          <input className="field" name="barangay" />
        </label>
        <label className="label">
          Nearest branch
          <select className="field" name="branch" defaultValue="">
            <option value="">Not sure yet</option>
            {BRANCHES.map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.city}, {b.province}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <label className="flex items-start gap-3 rounded-xl bg-sand p-4 text-sm">
        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 accent-[#B80000]" />
        <span>
          I agree that Manager&apos;s Pizza may keep my details to run my account, as described in the{" "}
          <Link href="/policies/privacy" className="font-medium text-brand-red-deep underline">Privacy Notice</Link>. *
        </span>
      </label>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full sm:w-auto">Create my account</SubmitButton>
      <p className="text-sm text-muted">
        Already have an account? <Link href="/login" className="font-semibold text-brand-red-deep underline">Sign in</Link>
      </p>
    </form>
  );
}
