import { NextResponse } from "next/server";
import { canOrder as canOrderFn, getViewer } from "@/lib/auth";
import { priceSheets } from "@/lib/prices-db";
import { priceKey } from "@/lib/products";
import { TIERS } from "@/lib/tiers";
import { unreadCount } from "@/lib/messages-db";

export const dynamic = "force-dynamic";

/** The signed-in customer's store context: order permission, price level and their prices. */
export async function GET() {
  const v = await getViewer().catch(() => null);
  if (!v) return NextResponse.json({ signedIn: false }, { headers: { "cache-control": "no-store" } });
  const p = v.profile;
  const canOrder = canOrderFn(p);
  const prices: Record<string, number> = {};
  if (canOrder) {
    for (const s of await priceSheets(p.branch_slug, p.tier))
      for (const r of s.rows)
        s.columns.forEach((c, i) => {
          const amount = r.prices[i];
          if (amount != null) prices[priceKey(s.slug, r.key, c.key)] = amount;
        });
  }
  return NextResponse.json(
    {
      signedIn: true,
      name: p?.full_name ?? null,
      status: p?.status ?? "pending",
      canOrder,
      tier: canOrder ? p.tier : null,
      tierName: canOrder ? TIERS.find((t) => t.id === p.tier)?.name ?? null : null,
      branch: p?.branch_slug ?? null,
      isStaff: v.isStaff,
      prices,
      unread: await unreadCount(v).catch(() => 0),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
