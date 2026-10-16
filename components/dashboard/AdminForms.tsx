"use client";

import { useActionState } from "react";
import { addStaff, savePrices, setTemporaryPassword, updateAccount } from "@/app/actions/dashboard";
import type { FormState } from "@/app/actions/auth";
import type { Profile } from "@/lib/auth";
import { BRANCHES } from "@/lib/branches";
import { TIERS } from "@/lib/tiers";
import type { PriceSheet } from "@/lib/catalog";
import { formatPeso } from "@/lib/catalog";
import { FormMessage, SubmitButton } from "./ui";

export function AccountEditor({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<FormState, FormData>(updateAccount.bind(null, profile.id), null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="label">
          Status
          <select className="field" name="status" defaultValue={profile.status}>
            <option value="pending">Waiting for approval</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <label className="label">
          Price level
          <select className="field" name="tier" defaultValue={profile.tier}>
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Branch
          <select className="field" name="branch" defaultValue={profile.branch_slug ?? ""}>
            <option value="">No branch yet</option>
            {BRANCHES.map((b) => (
              <option key={b.slug} value={b.slug}>{b.city}, {b.province}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="label">
        Admin notes (not shown to the customer)
        <textarea className="field min-h-20" name="adminNotes" defaultValue={profile.admin_notes ?? ""} />
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Save account</SubmitButton>
      </div>
    </form>
  );
}

export function TempPasswordForm({ id }: { id: string }) {
  const [state, action] = useActionState<FormState, FormData>(setTemporaryPassword.bind(null, id), null);
  return (
    <form action={action} className="grid gap-3">
      <label className="label">
        New temporary password (at least 8 characters)
        <input className="field" name="password" type="text" minLength={8} required autoComplete="off" />
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton className="btn-ghost">Set temporary password</SubmitButton>
      </div>
    </form>
  );
}

export function AddStaffForm({ canGrantFounder }: { canGrantFounder: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(addStaff, null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="label">
          Their account email
          <input className="field" name="email" type="email" required />
        </label>
        <label className="label">
          Role
          <select className="field" name="role" defaultValue="staff">
            <option value="staff">Branch staff</option>
            <option value="branch_oic">Branch OIC</option>
            <option value="finance">Finance</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super admin</option>
            {canGrantFounder && <option value="founder">Founder</option>}
          </select>
        </label>
        <label className="label">
          Branch
          <select className="field" name="branch" defaultValue="">
            <option value="">All branches (admins)</option>
            {BRANCHES.map((b) => (
              <option key={b.slug} value={b.slug}>{b.city}, {b.province}</option>
            ))}
          </select>
        </label>
      </div>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Add role</SubmitButton>
      </div>
    </form>
  );
}

/**
 * One price sheet for one (branch, level). Empty cells inherit the price shown in grey;
 * on the base list an empty cell means "not offered".
 */
export function PriceEditor({
  sheet,
  values,
  inherited,
  branch,
  tier,
  isBase,
}: {
  sheet: PriceSheet;
  values: Record<string, number | null>;
  inherited: Record<string, number | null>;
  branch: string;
  tier: string;
  isBase: boolean;
}) {
  const [state, action] = useActionState<FormState, FormData>(savePrices, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="branch" value={branch} />
      <input type="hidden" name="tier" value={tier} />
      <input type="hidden" name="sheet" value={sheet.slug} />
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="bg-ink text-white">
              <th scope="col" className="sticky left-0 bg-ink px-3 py-3 text-left font-semibold">{sheet.rowHeader}</th>
              {sheet.columns.map((c) => (
                <th key={c.key} scope="col" className="px-2 py-3 text-right font-semibold">
                  {c.label}
                  {c.sub && <span className="block text-[11px] font-normal text-white/70">{c.sub}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((r, i) => (
              <tr key={r.key} className={i % 2 ? "bg-cream/60" : "bg-white"}>
                <th scope="row" className={`sticky left-0 px-3 py-2 text-left font-medium ${i % 2 ? "bg-[#fffbf3]" : "bg-white"}`}>{r.label}</th>
                {sheet.columns.map((c) => {
                  const k = `${r.key}:${c.key}`;
                  const inh = inherited[k];
                  return (
                    <td key={c.key} className="px-1.5 py-1.5">
                      <input
                        name={`p:${k}`}
                        inputMode="decimal"
                        aria-label={`${r.label}, ${c.label}`}
                        defaultValue={values[k] ?? ""}
                        placeholder={isBase ? "–" : inh != null ? String(inh) : "–"}
                        className="w-full min-w-16 rounded-lg border border-line bg-white px-2 py-1.5 text-right tabular-nums placeholder:text-muted/60 focus:border-ink focus:outline-none"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        {isBase
          ? "This is the public price list. Leave a cell empty if the item is not offered."
          : `Grey numbers are the price that applies now (from a broader list). Type a price only where this branch / level should be different; leave the rest empty. Example: ${formatPeso(1250)} → type 1250.`}
      </p>
      <label className="label">
        Reason for this change * <span className="font-normal text-muted">(kept in the audit log)</span>
        <input className="field" name="reason" required placeholder="e.g. New supplier cost from 1 November" />
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Save prices</SubmitButton>
      </div>
    </form>
  );
}
