import type { Metadata } from "next";
import { businessTypeLabel } from "@/lib/site";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare, Phone } from "lucide-react";
import { canSeeBranch, requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { TIERS } from "@/lib/tiers";
import { formatPeso } from "@/lib/catalog";
import { KIND_LABEL, formatDate, leadBranch, type Lead } from "@/lib/leads";
import { LeadStatusBadge } from "@/components/dashboard/Badges";
import { LeadEditor } from "@/components/dashboard/LeadEditor";

export const metadata: Metadata = { title: "Request", robots: { index: false } };
export const dynamic = "force-dynamic";

const FULFILLMENT: Record<string, string> = {
  pickup: "Pickup at branch",
  local: "Local delivery",
  courier: "Courier",
  bus: "Bus cargo",
  air: "Air cargo",
  truck: "Truck",
};

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const BRANCHES = await getAllBranches();
  const { id } = await params;
  const v = await requireStaff(`/branch/requests/${id}`);
  const db = supabaseAdmin()!;
  const { data } = await db.from("leads").select("*").eq("id", id).maybeSingle();
  const lead = data as Lead | null;
  if (!lead || !canSeeBranch(v, leadBranch(lead))) notFound();
  const { data: account } = lead.user_id ? await db.from("profiles").select("full_name,business_name,tier,status").eq("id", lead.user_id).maybeSingle() : { data: null };
  const branch = BRANCHES.find((b) => b.slug === leadBranch(lead));
  const canMove = v.isAdmin || v.roles.some((r) => r.role === "branch_oic" && r.branch_slug === leadBranch(lead));
  const total = (lead.items ?? []).reduce((s, i) => s + (i.unitPrice ?? 0) * (i.qty ?? 0), 0);
  const smsBody = `Hi ${lead.name}, this is Manager's Pizza${branch ? ` ${branch.city}` : ""} about your request ${lead.reference}.`;

  return (
    <div className="container-x py-8 md:py-12">
      <Link href={v.isAdmin ? "/admin?tab=requests" : `/branch${branch ? `?b=${branch.slug}` : ""}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Back to requests
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-wide">{lead.reference}</h1>
        <LeadStatusBadge status={lead.status} />
      </div>
      <p className="mt-1 text-muted">
        {KIND_LABEL[lead.kind]} · received {formatDate(lead.created_at, true)} · {branch ? `${branch.city} branch` : "no branch yet"}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="grid content-start gap-6">
          <section className="card p-5">
            <h2 className="text-lg font-bold">Customer</h2>
            <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row k="Name" v={lead.name} />
              <Row k="Mobile" v={lead.mobile} />
              <Row k="Email" v={lead.email} />
              <Row k="Business" v={businessTypeLabel(lead.business_type)} />
              <Row k="Location" v={[lead.barangay, lead.city, lead.province].filter(Boolean).join(", ")} />
              <Row k="Address" v={lead.address} />
              <Row k="Fulfillment" v={lead.fulfillment ? FULFILLMENT[lead.fulfillment] ?? lead.fulfillment : null} />
              <Row
                k="Account"
                v={account ? `${account.full_name}${account.business_name ? ` · ${account.business_name}` : ""} · ${TIERS.find((t) => t.id === account.tier)?.name ?? ""} (${account.status})` : "Not signed in"}
              />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${lead.mobile.replace(/\s+/g, "")}`} className="btn-ghost"><Phone size={16} aria-hidden /> Call</a>
              <a href={`sms:${lead.mobile.replace(/\s+/g, "")}?body=${encodeURIComponent(smsBody)}`} className="btn-ghost"><MessageSquare size={16} aria-hidden /> SMS</a>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-bold">Items</h2>
            {lead.items?.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-muted">
                      <th className="py-2 font-medium">Item</th>
                      <th className="py-2 text-right font-medium">Qty</th>
                      <th className="py-2 text-right font-medium">List price</th>
                      <th className="py-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lead.items.map((i, k) => (
                      <tr key={k} className="border-b border-line/60">
                        <td className="py-2">{i.name}{i.option && <span className="text-muted"> · {i.option}</span>}</td>
                        <td className="py-2 text-right tabular-nums">{i.qty}</td>
                        <td className="py-2 text-right tabular-nums">{i.unitPrice != null ? formatPeso(i.unitPrice) : "–"}</td>
                        <td className="py-2 text-right tabular-nums">{i.unitPrice != null ? formatPeso(i.unitPrice * (i.qty ?? 0)) : "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="py-2 text-right font-semibold">Estimate at public prices</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{formatPeso(total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No items listed.</p>
            )}
            {lead.notes && (
              <>
                <h3 className="mt-4 text-sm font-bold">Customer notes</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-graphite">{lead.notes}</p>
              </>
            )}
            {lead.details && Object.keys(lead.details).length > 0 && (
              <>
                <h3 className="mt-4 text-sm font-bold">Other answers</h3>
                <dl className="mt-1 grid gap-1 text-sm">
                  {Object.entries(lead.details).map(([k, val]) => (
                    <Row key={k} k={k} v={typeof val === "string" ? val : JSON.stringify(val)} />
                  ))}
                </dl>
              </>
            )}
          </section>
        </div>

        <section className="card content-start p-5">
          <h2 className="text-lg font-bold">Update</h2>
          <p className="mt-1 text-sm text-muted">Last updated {formatDate(lead.updated_at, true)}</p>
          <div className="mt-4">
            <LeadEditor lead={lead} canMove={canMove} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium">{v || "–"}</dd>
    </div>
  );
}
