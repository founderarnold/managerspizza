import "server-only";
import { cache } from "react";
import { PRICE_SHEETS, type PriceSheet } from "./catalog";
import { sheetFor } from "./pricing";
import { supabaseAdmin } from "./supabase-server";
import type { TierId } from "./tiers";

/**
 * Prices from Supabase. Each price list belongs to one (branch, tier) pair, where null means
 * "every branch" / "every level". A price is looked up cell by cell in this order:
 *   branch + level  →  level (all branches)  →  branch (all levels)  →  base list
 * The base list (null, null) is the public price list. When Supabase is not configured the
 * code list in lib/catalog.ts is used instead.
 */
export interface ListKey {
  branch: string | null;
  tier: TierId | null;
}
export type Layer = Map<string, number | null>;

export const cellKey = (sheet: string, row: string, column: string) => `${sheet}|${row}|${column}`;

export function chainFor(key: ListKey): ListKey[] {
  const all: ListKey[] = [
    { branch: key.branch, tier: key.tier },
    { branch: null, tier: key.tier },
    { branch: key.branch, tier: null },
    { branch: null, tier: null },
  ];
  const seen = new Set<string>();
  return all.filter((k) => {
    const id = `${k.branch}|${k.tier}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

interface ListRow {
  id: string;
  branch_slug: string | null;
  tier: TierId | null;
  effective_from: string;
}

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

/** Current list id for every (branch, tier) pair that has one. */
export const currentLists = cache(async (): Promise<Map<string, string> | null> => {
  const db = supabaseAdmin();
  if (!db) return null;
  const d = today();
  const { data, error } = await db
    .from("price_lists")
    .select("id,branch_slug,tier,effective_from")
    .lte("effective_from", d)
    .or(`effective_to.is.null,effective_to.gte.${d}`)
    .order("effective_from", { ascending: true })
    .order("created_at", { ascending: true });
  if (error || !data) return null;
  const out = new Map<string, string>();
  for (const l of data as ListRow[]) out.set(`${l.branch_slug}|${l.tier}`, l.id); // later lists win
  return out;
});

/** All items of one list, as a cell → amount map. */
export const listItems = cache(async (listId: string): Promise<Layer> => {
  const db = supabaseAdmin()!;
  const layer: Layer = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from("price_list_items")
      .select("sheet_slug,row_key,column_key,amount")
      .eq("price_list_id", listId)
      .range(from, from + 999);
    if (error || !data) break;
    for (const i of data) layer.set(cellKey(i.sheet_slug, i.row_key, i.column_key), i.amount == null ? null : Number(i.amount));
    if (data.length < 1000) break;
  }
  return layer;
});

/** The layers for a lookup chain, in order (missing lists are skipped). */
export async function layersFor(chain: ListKey[]): Promise<Layer[] | null> {
  const lists = await currentLists();
  if (!lists) return null;
  const ids = chain.map((k) => lists.get(`${k.branch}|${k.tier}`)).filter((id): id is string => !!id);
  return Promise.all(ids.map((id) => listItems(id)));
}

export function resolveCell(layers: Layer[], key: string): number | null {
  for (const l of layers) if (l.has(key)) return l.get(key) ?? null;
  return null;
}

function applyLayers(sheet: PriceSheet, layers: Layer[]): PriceSheet {
  return {
    ...sheet,
    rows: sheet.rows.map((r) => ({
      ...r,
      prices: sheet.columns.map((c) => resolveCell(layers, cellKey(sheet.slug, r.key, c.key))),
    })),
  };
}

/** Every price sheet with prices for one branch and level (public list when ctx is empty). */
export const priceSheets = cache(async (branch: string | null = null, tier: TierId | null = null): Promise<PriceSheet[]> => {
  const layers = await layersFor(chainFor({ branch, tier }));
  if (!layers || layers.length === 0) return PRICE_SHEETS.map((s) => sheetFor(s.slug, { branch: branch ?? undefined, tier: tier ?? undefined })!);
  return PRICE_SHEETS.map((s) => applyLayers(s, layers));
});

export async function priceSheet(slug: string, branch: string | null = null, tier: TierId | null = null) {
  return (await priceSheets(branch, tier)).find((s) => s.slug === slug);
}
