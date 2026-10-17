import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getAllBranches } from "@/lib/branches-db";
import { formatPeso } from "@/lib/catalog";
import { formatDate } from "@/lib/leads";
import { OPEN_ORDER_STATUSES, ORDER_STATUSES, deliveryLabel, type Order } from "@/lib/orders";
import { OrderStatusBadge } from "@/components/shop/OrderStatusBadge";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BranchOrdersPage({ searchParams }: { searchParams: Promise<{ b?: string; status?: string }> }) {
  const v = await requireStaff("/branch/orders");
  const sp = await searchParams;
  const all = await getAllBranches();
  const mine = v.isAdmin ? all : all.filter((b) => v.staffBranches?.includes(b.slug));
  const b = sp.b === "all" && v.isAdmin ? null : mine.find((x) => x.slug === sp.b) ?? (v.isAdmin ? null : mine[0]);
  const status = sp.status ?? "open";
  let q = supabaseAdmin()!.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
  if (b) q = q.eq("branch_slug", b.slug);
  else if (!v.isAdmin) q = q.in("branch_slug", v.staffBranches ?? []);
  if (status === "open") q = q.in("status", OPEN_ORDER_STATUSES);
  else if (status !== "all") q = q.eq("status", status);
  const { data } = await q;
  const orders = (data ?? []) as Order[];
  const base = `/branch/orders?b=${b?.slug ?? "all"}`;
  const chips = [{ id: "open", label: "Open" }, ...ORDER_STATUSES.map((s) => ({ id: s.id, label: s.label })), { id: "all", label: "All" }];

  return (
    <div className="container-x pb-16 pt-6 md:pt-10">
      <Link href="/branch" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft size={16} aria-hidden /> Branch dashboard
      </Link>
      <h1 className="mt-2 text-3xl font-extrabold">Orders · {b ? b.city : "All branches"}</h1>
      {(mine.length > 1 || v.isAdmin) && (
        <nav aria-label="Branches" className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {v.isAdmin && (
            <Link href={`/branch/orders?b=all&status=${status}`} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${!b ? "border-brand-red-deep bg-brand-red-deep text-white" : "border-line bg-white"}`}>All</Link>
          )}
          {mine.map((x) => (
            <Link key={x.slug} href={`/branch/orders?b=${x.slug}&status=${status}`} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${b?.slug === x.slug ? "border-brand-red-deep bg-brand-red-deep text-white" : "border-line bg-white"}`}>
              {x.city}
            </Link>
          ))}
        </nav>
      )}
      <nav aria-label="Status" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {chips.map((c) => (
          <Link key={c.id} href={`${base}&status=${c.id}`} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${status === c.id ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            {c.label}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="card mt-5 p-6 text-muted">No orders here.</p>
      ) : (
        <ul className="mt-5 grid gap-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/branch/orders/${o.id}`} className="card flex items-center gap-3 p-4 hover:shadow-lift">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <strong className="font-display tracking-wide">{o.reference}</strong>
                    <OrderStatusBadge status={o.status} />
                    {!b && <span className="chip">{all.find((x) => x.slug === o.branch_slug)?.city ?? "–"}</span>}
                  </div>
                  <p className="mt-1 truncate text-sm"><span className="font-medium">{o.contact_name}</span><span className="text-muted"> · {o.contact_mobile} · {deliveryLabel(o.delivery_method)}</span></p>
                  <p className="text-xs text-muted">{formatDate(o.created_at, true)} · {o.items.length} items · {formatPeso(Number(o.subtotal) + Number(o.adjustment) + Number(o.shipping_fee ?? 0))}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
