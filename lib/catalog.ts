// Temporary price list, transcribed from "Manager's Pizza PRICE LIST Updated as of 2May26"
// (Manager's Pizza Depot Quezon City). It is the base list for every branch and every
// account tier until per-branch / per-tier lists are published (see lib/pricing.ts).

export type CategoryId =
  | "ready-to-cook"
  | "dough-crust"
  | "cheese-sauce-toppings"
  | "boxes-packaging"
  | "equipment";

export type Handling = "frozen" | "chilled" | "ambient";

export interface PriceColumn {
  key: string;
  label: string;
  sub?: string;
}

export interface PriceRow {
  key: string;
  label: string;
  /** One value per column, in PHP. null = not offered. */
  prices: (number | null)[];
}

export interface PriceSheet {
  slug: string;
  name: string;
  category: CategoryId;
  summary: string;
  handling: Handling;
  /** What one price buys, e.g. "per piece". */
  unit: string;
  rowHeader: string;
  columns: PriceColumn[];
  rows: PriceRow[];
  /** Order rules printed on the price list. */
  terms?: string[];
  /** Price suffix shown after amounts in specific columns, e.g. "/pc." */
  suffix?: Record<string, string>;
}

export const PRICE_LIST_SOURCE = {
  title: "Manager's Pizza Price List",
  effective: "2026-05-02",
  effectiveLabel: "2 May 2026",
  issuedBy: "Manager's Pizza Depot Quezon City",
};

export const CATEGORIES: { id: CategoryId; name: string; blurb: string }[] = [
  {
    id: "ready-to-cook",
    name: "Ready-to-Cook Pizzas",
    blurb: "Classic and premium R2C pizzas from 4\" to 14\", boxed with hot sauce from 9\" up.",
  },
  {
    id: "dough-crust",
    name: "Dough & Crust",
    blurb: "Round and square crusts, thin or thick, priced by volume.",
  },
  {
    id: "cheese-sauce-toppings",
    name: "Cheese, Sauce & Toppings",
    blurb: "Mozzarella, quickmelt, sauces, frozen meats and pantry toppings.",
  },
  {
    id: "boxes-packaging",
    name: "Boxes & Packaging",
    blurb: "Plain, generic-print and custom-design corrugated and claycoated boxes.",
  },
  {
    id: "equipment",
    name: "Equipment & Essentials",
    blurb: "Ovens, pans, slicers, paddles and the small things every kitchen needs.",
  },
];

const R2C_SIZES: PriceColumn[] = [
  { key: "4in", label: '4"', sub: "no box" },
  { key: "6in", label: '6"', sub: "no box" },
  { key: "9in", label: '9"', sub: "w/ box" },
  { key: "10in", label: '10"', sub: "w/ box" },
  { key: "11in", label: '11"', sub: "w/ box" },
  { key: "12in", label: '12"', sub: "w/ box" },
  { key: "14in", label: '14"', sub: "w/ box" },
];

const RETAIL_WHOLESALE = (retailSub: string, wholesaleSub: string): PriceColumn[] => [
  { key: "retail", label: "Retail", sub: retailSub },
  { key: "wholesale", label: "Wholesale", sub: wholesaleSub },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const rows = (data: [string, ...(number | null)[]][]): PriceRow[] =>
  data.map(([label, ...prices]) => ({ key: slug(label), label, prices }));

export const PRICE_SHEETS: PriceSheet[] = [
  {
    slug: "classic-r2c-pizza",
    name: "Classic R2C Pizza",
    category: "ready-to-cook",
    summary:
      "Our best-selling ready-to-cook pizzas in seven sizes. Sizes 9\" to 14\" come with a box and hot sauce.",
    handling: "frozen",
    unit: "per piece",
    rowHeader: "Flavor",
    columns: R2C_SIZES,
    rows: rows([
      ["Triple Cheese", 10, 20, 60, 70, 80, 95, 125],
      ["Ham & Cheese", 10, 20, 65, 75, 85, 105, 135],
      ["Hawaiian", 12, 25, 85, 95, 105, 125, 155],
      ["Beef & Mushroom", 15, 30, 85, 95, 105, 125, 155],
      ["Pepperoni", 15, 30, 95, 105, 115, 135, 165],
      ["All Meat", 18, 35, 115, 125, 135, 155, 185],
      ["Supreme", 20, 40, 125, 145, 165, 185, 215],
    ]),
    terms: [
      "Minimum order: 150 pcs.",
      "Add ₱5/pc. below the minimum order.",
      "Less ₱5/pc. for 200 pcs. and up (not for 4\" and 6\").",
      "Add ₱10/pc. for 10\" or 11\" square.",
    ],
  },
  {
    slug: "premium-r2c-pizza",
    name: "Premium R2C Pizza",
    category: "ready-to-cook",
    summary:
      "Premium flavors for stores that want a signature menu. Sizes 9\" to 14\" come with a box.",
    handling: "frozen",
    unit: "per piece",
    rowHeader: "Flavor",
    columns: R2C_SIZES,
    rows: rows([
      ["Cheesy Garlic", 15, 30, 70, 80, 85, 95, 125],
      ["Aloha Overload", 15, 30, 75, 85, 90, 105, 135],
      ["Italian Pepperoni", 18, 40, 90, 105, 115, 125, 155],
      ["Garlic Shrimp", 18, 60, 90, 105, 115, 125, 155],
      ["Creamy Spinach", 18, 65, 100, 115, 125, 135, 165],
    ]),
    terms: [
      "Minimum order: 200 pcs.",
      "Add ₱10/pc. below the minimum order.",
      "Less ₱5/pc. for 250 pcs. and up (not for 4\" and 6\").",
      "Add ₱10/pc. for 10\" or 11\" square.",
    ],
  },
  {
    slug: "round-dough-crust",
    name: "Round Dough / Crust",
    category: "dough-crust",
    summary: "Round pizza crusts from 4\" to 14\", thin or thick.",
    handling: "frozen",
    unit: "per piece",
    rowHeader: "Size",
    columns: [
      { key: "thin-199", label: "Thin", sub: "199 pcs. & below" },
      { key: "thin-200", label: "Thin", sub: "200 pcs. & up" },
      { key: "thick-199", label: "Thick", sub: "199 pcs. & below" },
      { key: "thick-200", label: "Thick", sub: "200 pcs. & up" },
    ],
    rows: rows([
      ['4 inches', 8, 6, 10, 9],
      ['6 inches', 16, 14, 18, 17],
      ['9 inches', 20, 19, 22, 21],
      ['10 inches', 26, 24, 29, 28],
      ['11 inches', 28, 26, 32, 31],
      ['12 inches', 31, 29, 35, 34],
      ['14 inches', 49, 45, 55, 54],
    ]),
  },
  {
    slug: "square-dough-crust",
    name: "Square Dough / Crust",
    category: "dough-crust",
    summary: "Square crusts for 10\", 11\" and 12\" pizzas, thin or thick.",
    handling: "frozen",
    unit: "per piece",
    rowHeader: "Size",
    columns: [
      { key: "thin-199", label: "Thin", sub: "199 pcs. & below" },
      { key: "thin-200", label: "Thin", sub: "200 pcs. & up" },
      { key: "thick-199", label: "Thick", sub: "199 pcs. & below" },
      { key: "thick-200", label: "Thick", sub: "200 pcs. & up" },
    ],
    rows: rows([
      ['10 inches', 27, 25, 30, 29],
      ['11 inches', 29, 27, 32, 31],
      ['12 inches', 35, 32, 38, 37],
    ]),
  },
  {
    slug: "pizza-cheese-sauces",
    name: "Pizza Cheese & Sauces",
    category: "cheese-sauce-toppings",
    summary: "Mozzarella, quickmelt, melting cheese, liquid cheese and pizza sauce.",
    handling: "chilled",
    unit: "per pack",
    rowHeader: "Item",
    columns: RETAIL_WHOLESALE("below 10 boxes", "10+ boxes"),
    rows: rows([
      ["Arla Mozzarella Sticks 2kg", 975, 970],
      ["Che-Vital Quickmelt 2kg", 785, 770],
      ["Melting Cheese 1.9kg", 695, 680],
      ["Manager's YQ Cheese 1.9kg", 685, 580],
      ["Premium Liquid Cheese 600g", 170, 165],
      ["Premium Pizza Sauce 700g", 135, 125],
    ]),
    terms: ["For bulk orders of melting cheese, see Manager's YOBO Quickmelt below."],
  },
  {
    slug: "managers-yobo-quickmelt",
    name: "Manager's YOBO Quickmelt (MMC YQ)",
    category: "cheese-sauce-toppings",
    summary: "Our own melting cheese, priced lower the more cases you order. 6 bars per case.",
    handling: "chilled",
    unit: "per bar / per case",
    rowHeader: "Order quantity",
    columns: [
      { key: "bar", label: "Unit price", sub: "per bar" },
      { key: "case", label: "Price per case", sub: "6 bars/case" },
    ],
    rows: rows([
      ["1 to 5 cheese bars", 660, null],
      ["2 to 4 cases", 650, 3900],
      ["6 to 10 cases", 615, 3690],
      ["11 to 20 cases", 575, 3450],
      ["21 to 50 cases", 530, 3180],
      ["51 to 80 cases", 525, 3150],
      ["81 to 100 cases", 505, 3030],
      ["101 to 200 cases", 465, 2780],
    ]),
  },
  {
    slug: "frozen-meat-toppings",
    name: "Frozen Meat Toppings",
    category: "cheese-sauce-toppings",
    summary: "Branded and brandless pepperoni, ham, beef and bacon, plus pineapple and mushroom.",
    handling: "frozen",
    unit: "per pack",
    rowHeader: "Item",
    columns: RETAIL_WHOLESALE("below 10 kg", "10 kg & up"),
    rows: rows([
      ["Swift Pepperoni 1kg", 405, 390],
      ["Swift Ham 1kg", 310, 290],
      ["Brandless Pepperoni 1kg", 250, 245],
      ["Brandless Ham 1kg", 240, 220],
      ["Brandless Beef 1kg", 385, 375],
      ["Purefoods Beef 1kg", 390, 385],
      ["CDO Bacon Bits 1kg", 390, 385],
      ["El Grande Bacon Bits 1kg", 390, 385],
      ["Swift Bacon Strips 1kg", 390, 385],
      ["Pineapple Tidbits 822g", 145, 125],
      ["Mushroom 850g", 135, 115],
    ]),
  },
  {
    slug: "other-pizza-ingredients",
    name: "Other Pizza Ingredients",
    category: "cheese-sauce-toppings",
    summary: "Hot sauce sachets and gallons, tomato sauce and banana ketchup.",
    handling: "ambient",
    unit: "per pack / gallon",
    rowHeader: "Item",
    columns: RETAIL_WHOLESALE("", ""),
    rows: rows([
      ["Del Monte Hot Sauce (100 pcs.)", 200, 195],
      ["CLEAR Hot Sauce Sachet (100 pcs.)", 185, 1.8],
      ["MGRS Hot Sauce Sachet (100 pcs.)", 190, 1.85],
      ["Hot Sauce Gallon", 140, 135],
      ["Tomato Sauce Gallon", 145, 140],
      ["Banana Ketchup Gallon", 120, 115],
    ]),
    terms: [
      "Retail hot sauce prices are per pack of 100. Wholesale prices for CLEAR and MGRS sachets are per piece.",
    ],
  },
  {
    slug: "corrugated-pizza-boxes",
    name: "Corrugated Pizza Boxes",
    category: "boxes-packaging",
    summary: "Plain and generic-print corrugated boxes from 6\" to 36\".",
    handling: "ambient",
    unit: "per piece",
    rowHeader: "Size",
    columns: [
      { key: "plain-retail", label: "Plain", sub: "Retail/pc." },
      { key: "plain-wholesale", label: "Plain", sub: "Wholesale/pc." },
      { key: "print-retail", label: "Generic print", sub: "Retail/pc." },
      { key: "print-wholesale", label: "Generic print", sub: "Wholesale/pc." },
    ],
    rows: rows([
      ["6 inches", 8, 7.65, 8, 7.75],
      ["9 inches", 10, 9.65, 10, 9.75],
      ["10 inches", 12, 11.65, 12, 11.75],
      ["11 inches", 13, 12.65, 13, 12.75],
      ["12 inches", 14, 13.65, 14, 13.75],
      ["14 inches", 17, 16.4, 17, 16.5],
      ["16 inches", null, null, 19.5, 18.5],
      ["18 inches", null, null, 23.5, 22.75],
      ["20 inches", null, null, 26.75, 25.75],
      ["30 inches", null, null, 59.5, 57.5],
      ["36 inches", null, null, 78, 74],
    ]),
  },
  {
    slug: "custom-design-pizza-boxes",
    name: "Customized Design Pizza Boxes",
    category: "boxes-packaging",
    summary: "Your own design printed on claycoated or corrugated boxes, in bulk.",
    handling: "ambient",
    unit: "per piece",
    rowHeader: "Size",
    columns: [
      { key: "clay-2000", label: "Claycoated", sub: "MOQ 2,000 pcs. wholesale/pc." },
      { key: "clay-5000", label: "Claycoated", sub: "MOQ 5,000 pcs. bulk/pc." },
      { key: "corr-5000", label: "Corrugated", sub: "MOQ 5,000 pcs. bulk/pc." },
      { key: "corr-10000", label: "Corrugated", sub: "MOQ 10,000 pcs. wholesale/pc." },
    ],
    rows: rows([
      ["6 inches", 8, 7.65, 8, 7.75],
      ["9 inches", 10, 9.65, 10, 9.75],
      ["10 inches", 12, 11.65, 12, 11.75],
      ["11 inches", 13, 12.65, 13, 12.75],
      ["12 inches", 14, 13.65, 14, 13.75],
      ["14 inches", 17, 16.4, 17, 16.5],
      ["16 inches", null, null, 19.5, 18.5],
      ["18 inches", null, null, 23.5, 22.75],
      ["20 inches", null, null, 26.75, 25.75],
      ["30 inches", null, null, 59.5, 57.5],
      ["36 inches", null, null, 78, 74],
    ]),
  },
  {
    slug: "equipment",
    name: "Equipment",
    category: "equipment",
    summary: "Electric ovens, a two-layer pizza oven and round pizza pans.",
    handling: "ambient",
    unit: "per unit",
    rowHeader: "Item",
    columns: RETAIL_WHOLESALE("", ""),
    rows: rows([
      ["40L Electric Oven", 6850, 6420],
      ["30L Electric Oven", 5750, 5450],
      ['12" Two Layer Pizza Oven', 2500, 2450],
      ['10" Round Pizza Pan', 165, 160],
      ['11" Round Pizza Pan', 185, 180],
      ['12" Round Pizza Pan', 215, 210],
    ]),
  },
  {
    slug: "pizza-essentials",
    name: "Other Pizza Essentials",
    category: "equipment",
    summary: "Wax paper, slicers, graters, pizza savers and paddles.",
    handling: "ambient",
    unit: "per piece",
    rowHeader: "Item",
    columns: RETAIL_WHOLESALE("", ""),
    rows: rows([
      ["Grease / Wax Paper", 1.5, 1.2],
      ["Pizza Slicer (big)", 299, 199],
      ["Cheese Grater / Shredder", 60, 50],
      ['Pizza Saver 1.5"', 1.85, 1.5],
      ["Pizza Paddle", 340, 290],
    ]),
  },
];

export const HANDLING_LABEL: Record<Handling, string> = {
  frozen: "Frozen",
  chilled: "Chilled",
  ambient: "Room temperature",
};

export const HANDLING_NOTE: Record<Handling, string> = {
  frozen: "Keep frozen until use. Shipped only on routes that can hold the cold chain.",
  chilled: "Keep refrigerated. Shipped only on routes that can hold the cold chain.",
  ambient: "Store in a cool, dry place.",
};

export function getSheet(slug: string) {
  return PRICE_SHEETS.find((s) => s.slug === slug);
}

export function sheetsInCategory(id: CategoryId) {
  return PRICE_SHEETS.filter((s) => s.category === id);
}

export function categoryName(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

/** Lowest and highest price on a sheet, for cards. */
export function priceRange(sheet: PriceSheet) {
  const all = sheet.rows.flatMap((r) => r.prices).filter((p): p is number => p != null);
  return { min: Math.min(...all), max: Math.max(...all) };
}

export function formatPeso(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}
