"use client";

import { useActionState } from "react";
import { startConversation } from "@/app/actions/shop";
import type { FormState } from "@/app/actions/auth";
import { FormMessage, SubmitButton } from "@/components/dashboard/ui";

export function NewConversationForm({ order, defaultBranch, branches }: { order: string; defaultBranch: string; branches: { slug: string; label: string }[] }) {
  const [state, action] = useActionState<FormState, FormData>(startConversation, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="order" value={order} />
      {order ? (
        <p className="rounded-xl bg-sand px-4 py-3 text-sm">About order <strong>{order}</strong>. It goes to the branch handling your order.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            Subject *
            <input className="field" name="subject" required placeholder="e.g. Price of 500 pcs. 12-inch boxes" />
          </label>
          <label className="label">
            Branch
            <select className="field" name="branch" defaultValue={defaultBranch}>
              <option value="">Manager&apos;s Pizza head office</option>
              {branches.map((b) => (
                <option key={b.slug} value={b.slug}>{b.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <label className="label">
        Message *
        <textarea className="field min-h-32" name="body" required placeholder="Write your question or request…" />
      </label>
      <FormMessage state={state} />
      <div>
        <SubmitButton>Send message</SubmitButton>
      </div>
    </form>
  );
}
