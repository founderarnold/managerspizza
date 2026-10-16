"use client";

import { useActionState } from "react";
import { updateLead } from "@/app/actions/dashboard";
import type { FormState } from "@/app/actions/auth";
import { BRANCHES } from "@/lib/branches";
import { LEAD_STATUSES, type Lead } from "@/lib/leads";
import { FormMessage, SubmitButton } from "./ui";

export function LeadEditor({ lead, canMove }: { lead: Lead; canMove: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(updateLead.bind(null, lead.id), null);
  const chosen = BRANCHES.find((b) => b.slug === lead.branch_slug);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label">
          Status
          <select className="field" name="status" defaultValue={lead.status}>
            {LEAD_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="label">
          Handled by branch
          <select className="field" name="assignedBranch" defaultValue={lead.assigned_branch ?? ""} disabled={!canMove}>
            <option value="">{chosen ? `Customer's choice (${chosen.city})` : "Not assigned yet"}</option>
            {BRANCHES.map((b) => (
              <option key={b.slug} value={b.slug}>{b.city}, {b.province}</option>
            ))}
          </select>
          {!canMove && <input type="hidden" name="assignedBranch" value={lead.assigned_branch ?? ""} />}
        </label>
      </div>
      <fieldset className="grid gap-4 rounded-2xl bg-sand p-4">
        <legend className="px-1 text-sm font-bold">Reply to the customer (they see this under My account)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Quoted amount (PHP)
            <input className="field" name="amount" inputMode="decimal" defaultValue={lead.quote?.amount ?? ""} placeholder="e.g. 12500" />
          </label>
          <label className="label">
            Valid until
            <input className="field" name="validUntil" type="date" defaultValue={lead.quote?.valid_until ?? ""} />
          </label>
        </div>
        <label className="label">
          Message
          <textarea className="field min-h-24" name="reply" defaultValue={lead.quote?.reply ?? ""} placeholder="Items, shipping, payment terms, pickup schedule…" />
        </label>
      </fieldset>
      <label className="label">
        Internal notes (staff only)
        <textarea className="field min-h-20" name="staffNotes" defaultValue={lead.staff_notes ?? ""} />
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Save</SubmitButton>
      </div>
    </form>
  );
}
