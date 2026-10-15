import Link from "next/link";
import { BRANCHES } from "@/lib/branches";

export function ContactFields({ withLocation = true }: { withLocation?: boolean }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="label sm:col-span-2">
          Full name *
          <input className="field" name="name" required autoComplete="name" />
        </label>
        <label className="label">
          Mobile number *
          <input className="field" name="mobile" required inputMode="tel" autoComplete="tel" placeholder="0917 123 4567" />
        </label>
        <label className="label">
          Email
          <input className="field" name="email" type="email" autoComplete="email" />
        </label>
      </div>
      {withLocation && (
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="label">
            Province *
            <input className="field" name="province" required autoComplete="address-level1" />
          </label>
          <label className="label">
            City / municipality *
            <input className="field" name="city" required autoComplete="address-level2" />
          </label>
          <label className="label">
            Barangay
            <input className="field" name="barangay" />
          </label>
          <label className="label sm:col-span-3">
            Nearest branch
            <select className="field" name="branch" defaultValue="">
              <option value="">Let Manager&apos;s Pizza choose</option>
              {BRANCHES.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.city}, {b.province}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </>
  );
}

export function ConsentFields() {
  return (
    <div className="grid gap-3 rounded-xl bg-sand p-4 text-sm">
      <label className="flex items-start gap-3">
        <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 accent-[#B80000]" />
        <span>
          I agree that Manager&apos;s Pizza may contact me about this request and process my details as described in the{" "}
          <Link href="/policies/privacy" className="font-medium text-brand-red-deep underline">Privacy Notice</Link>. *
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" name="marketing" className="mt-0.5 h-5 w-5 accent-[#B80000]" />
        <span>Optional: send me news about promos, new products and branch openings.</span>
      </label>
    </div>
  );
}
