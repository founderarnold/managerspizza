"use client";

import { LeadForm } from "./LeadForm";
import { ConsentFields, ContactFields } from "./ContactFields";

export function SimpleLeadForm({
  kind,
  submitLabel,
  withSchedule = false,
  program,
}: {
  kind: "consultation" | "trial" | "partner";
  submitLabel: string;
  withSchedule?: boolean;
  program?: string;
}) {
  return (
    <LeadForm
      kind={kind}
      submitLabel={submitLabel}
      extra={(fd) => {
        const details: Record<string, unknown> = {};
        for (const k of ["preferredDate", "preferredTime", "channel", "businessName", "territory", "yearsOperating", "audience"]) {
          const v = fd.get(k);
          if (v) details[k] = v;
        }
        if (program) details.program = program;
        return { details, summary: Object.entries(details).map(([k, v]) => `${k}: ${v}`).join("\n") };
      }}
    >
      {program && (
        <label className="label">
          Business or legal name
          <input className="field" name="businessName" />
        </label>
      )}
      <ContactFields />
      {withSchedule && (
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="label">
            Preferred date
            <input className="field" type="date" name="preferredDate" />
          </label>
          <label className="label">
            Preferred time
            <select className="field" name="preferredTime" defaultValue="morning">
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          <label className="label">
            Contact by
            <select className="field" name="channel" defaultValue="call">
              <option value="call">Phone call</option>
              <option value="sms">SMS</option>
              <option value="viber">Viber</option>
              <option value="messenger">Messenger</option>
            </select>
          </label>
        </div>
      )}
      {program && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label">
            {program === "reseller-retailer" ? "Where you will sell" : "Territory requested"}
            <input
              className="field"
              name="territory"
              placeholder={program === "reseller-retailer" ? "e.g. Brgy. San Isidro, Tacloban City" : program === "distributor" ? "e.g. Province of Leyte" : "e.g. Province of Bulacan"}
            />
          </label>
          <label className="label">
            Years operating
            <input className="field" name="yearsOperating" inputMode="numeric" />
          </label>
          {(program === "affiliate" || program === "dropshipper") && (
            <label className="label sm:col-span-2">
              Channels and audience
              <input className="field" name="audience" placeholder="e.g. Facebook page with 5,000 followers" />
            </label>
          )}
        </div>
      )}
      <label className="label">
        Notes
        <textarea className="field min-h-20" name="notes" />
      </label>
      {program && (
        <p className="text-sm text-muted">
          We will ask for documents (business permit, DTI/SEC, BIR) privately after our first call. Please do not send IDs through this form.
        </p>
      )}
      <ConsentFields />
    </LeadForm>
  );
}
