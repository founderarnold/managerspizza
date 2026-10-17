import { PRICE_SHEETS, type CategoryId, type Handling, type PriceSheet } from "./catalog";

/**
 * The online store is built from the price sheets: each flavor / item row is a product and its
 * columns (sizes, retail / wholesale…) are the variants. Sheets whose rows are order-quantity
 * brackets (YOBO Quickmelt) are one product with a variant per bracket.
 *
 * Customized and made-to-order items are "Request for Quotation" (RFQ): they go to the quote list
 * instead of the cart.
 */
export const RFQ_SHEETS = new Set(["round-dough-crust", "square-dough-crust", "corrugated-pizza-boxes", "custom-design-pizza-boxes"]);
const RFQ_ROW = /sachet/i;

export interface Variant {
  /** "row:column" */
  key: string;
  row: string;
  column: string;
  label: string;
  sub?: string;
}

export interface Product {
  /** "sheet/row", or "sheet" when the whole sheet is one product */
  id: string;
  sheet: string;
  sheetName: string;
  name: string;
  category: CategoryId;
  handling: Handling;
  unit: string;
  rfq: boolean;
  variants: Variant[];
  terms?: string[];
}

const SHEET_IS_ONE_PRODUCT = new Set(["managers-yobo-quickmelt"]);

function productsOf(s: PriceSheet): Product[] {
  const base = { sheet: s.slug, sheetName: s.name, category: s.category, handling: s.handling, unit: s.unit, terms: s.terms };
  const offered = (r: PriceSheet["rows"][number], i: number) => r.prices[i] != null;
  if (SHEET_IS_ONE_PRODUCT.has(s.slug)) {
    const variants = s.rows.flatMap((r) =>
      s.columns.filter((_, i) => offered(r, i)).map((c) => ({ key: `${r.key}:${c.key}`, row: r.key, column: c.key, label: r.label, sub: c.sub ? `${c.label}, ${c.sub}` : c.label })),
    );
    return [{ ...base, id: s.slug, name: s.name, rfq: RFQ_SHEETS.has(s.slug), variants }];
  }
  return s.rows.map((r) => ({
    ...base,
    id: `${s.slug}/${r.key}`,
    name: s.category === "ready-to-cook" ? `${r.label} ${s.name}` : s.rowHeader === "Size" ? `${s.name} ${r.label}` : r.label,
    rfq: RFQ_SHEETS.has(s.slug) || RFQ_ROW.test(r.label),
    variants: s.columns
      .map((c, i) => ({ c, i }))
      .filter(({ i }) => offered(r, i))
      .map(({ c }) => ({ key: `${r.key}:${c.key}`, row: r.key, column: c.key, label: c.label, sub: c.sub })),
  }));
}

export const PRODUCTS: Product[] = PRICE_SHEETS.flatMap(productsOf);

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

/** The product and variant for a cart line. */
export function findVariant(sheet: string, row: string, column: string) {
  for (const p of PRODUCTS) {
    if (p.sheet !== sheet) continue;
    const v = p.variants.find((x) => x.row === row && x.column === column);
    if (v) return { product: p, variant: v };
  }
  return null;
}

export const variantLabel = (v: Variant) => (v.sub ? `${v.label} · ${v.sub}` : v.label);

export const priceKey = (sheet: string, row: string, column: string) => `${sheet}|${row}|${column}`;
