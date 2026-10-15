import { PRICE_SHEETS, type PriceSheet } from "./catalog";
import type { TierId } from "./tiers";

/**
 * Price resolution.
 *
 * Today every branch and every tier uses the same temporary list (lib/catalog.ts).
 * To give a branch or a tier its own price, add an override here (or, once Supabase is
 * connected, a row in price_list_items for that branch + tier). Lookup order:
 *   branch + tier  →  any branch + tier  →  branch + any tier  →  base list
 */
export interface PriceOverride {
  branch?: string; // branch slug, omitted = every branch
  tier?: TierId; // omitted = every tier
  sheet: string;
  row: string;
  column: string;
  amount: number | null;
}

export const PRICE_OVERRIDES: PriceOverride[] = [];

export function resolvePrice(
  sheet: PriceSheet,
  rowKey: string,
  columnIndex: number,
  ctx: { branch?: string; tier?: TierId } = {},
): number | null {
  const column = sheet.columns[columnIndex]?.key;
  const match = (o: PriceOverride, b?: string, t?: TierId) =>
    o.sheet === sheet.slug && o.row === rowKey && o.column === column && o.branch === b && o.tier === t;
  const order: [string | undefined, TierId | undefined][] = [
    [ctx.branch, ctx.tier],
    [undefined, ctx.tier],
    [ctx.branch, undefined],
  ];
  for (const [b, t] of order) {
    if (b === undefined && t === undefined) continue;
    const hit = PRICE_OVERRIDES.find((o) => match(o, b, t));
    if (hit) return hit.amount;
  }
  return sheet.rows.find((r) => r.key === rowKey)?.prices[columnIndex] ?? null;
}

/** A copy of the sheet with every price resolved for one branch and tier. */
export function sheetFor(slug: string, ctx: { branch?: string; tier?: TierId } = {}) {
  const sheet = PRICE_SHEETS.find((s) => s.slug === slug);
  if (!sheet) return undefined;
  return {
    ...sheet,
    rows: sheet.rows.map((r) => ({
      ...r,
      prices: r.prices.map((_, i) => resolvePrice(sheet, r.key, i, ctx)),
    })),
  };
}
