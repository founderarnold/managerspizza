"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { SITE } from "@/lib/site";

export type LeadResult = { ref: string; saved: boolean; summary: string };

/** Shared submit logic: posts to /api/leads and shows the confirmation. */
export function LeadForm({
  kind,
  children,
  submitLabel,
  extra,
  onDone,
}: {
  kind: "quote" | "consultation" | "trial" | "partner";
  children: React.ReactNode;
  submitLabel: string;
  extra?: (fd: FormData) => Record<string, unknown>;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LeadResult | null>(null);

  if (result) return <Confirmation result={result} />;

  return (
    <form
      noValidate={false}
      className="grid gap-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const base: Record<string, unknown> = {
          kind,
          name: fd.get("name"),
          mobile: fd.get("mobile"),
          email: fd.get("email"),
          province: fd.get("province"),
          city: fd.get("city"),
          barangay: fd.get("barangay"),
          address: fd.get("address"),
          branch: fd.get("branch"),
          businessType: fd.get("businessType"),
          fulfillment: fd.get("fulfillment"),
          notes: fd.get("notes"),
          consent: fd.get("consent") === "on",
          marketing: fd.get("marketing") === "on",
        };
        const payload = { ...base, ...(extra ? extra(fd) : {}) };
        setBusy(true);
        try {
          const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
          const summary = [
            `Manager's Pizza ${kind} request ${data.ref}`,
            `Name: ${base.name}`,
            `Mobile: ${base.mobile}`,
            base.city ? `Location: ${base.city}, ${base.province}` : "",
            typeof payload.summary === "string" ? payload.summary : "",
            base.notes ? `Notes: ${base.notes}` : "",
          ]
            .filter(Boolean)
            .join("\n");
          setResult({ ref: data.ref, saved: data.saved, summary });
          onDone?.();
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {children}
      {error && (
        <p role="alert" className="rounded-xl border border-brand-red-deep/30 bg-[#fff1f1] px-4 py-3 text-sm text-brand-red-deep">
          {error}
        </p>
      )}
      <div>
        <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
          {busy && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Confirmation({ result }: { result: LeadResult }) {
  const sms = `sms:${SITE.phoneLinks[0]}?body=${encodeURIComponent(result.summary)}`;
  return (
    <div className="card p-6 text-center sm:p-10" role="status">
      <CheckCircle2 size={44} className="mx-auto text-success" aria-hidden />
      <h2 className="mt-4 text-2xl font-bold">Thank you! Your reference number is</h2>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-wide text-brand-red-deep">{result.ref}</p>
      {result.saved ? (
        <p className="mx-auto mt-4 max-w-md text-muted">
          We received your request. Our team will contact you by phone or SMS within one business day. Keep your reference number for follow-ups.
        </p>
      ) : (
        <>
          <p className="mx-auto mt-4 max-w-md text-muted">
            To make sure it reaches us, please send this request to our Quezon City depot by SMS, or call {SITE.phones.join(" / ")}.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={sms} className="btn-primary">Send by SMS</a>
            <a href={`tel:${SITE.phoneLinks[0]}`} className="btn-ghost">Call {SITE.phones[0]}</a>
          </div>
          <pre className="mx-auto mt-6 max-w-md whitespace-pre-wrap rounded-xl bg-sand p-4 text-left text-xs">{result.summary}</pre>
        </>
      )}
    </div>
  );
}
