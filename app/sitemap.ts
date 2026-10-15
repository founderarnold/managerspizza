import type { MetadataRoute } from "next";
import { PRICE_SHEETS } from "@/lib/catalog";
import { PROGRAMS } from "@/lib/partners";
import { POLICIES } from "@/lib/policies";

const BASE = "https://www.managerspizza.com";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/", "/shop", "/start-a-business", "/branches", "/partners", "/resources", "/about", "/quote",
    ...PRICE_SHEETS.map((s) => `/shop/${s.slug}`),
    ...PROGRAMS.map((p) => `/partners/${p.slug}`),
    ...POLICIES.map((p) => `/policies/${p.slug}`),
  ];
  return paths.map((p) => ({ url: `${BASE}${p}`, lastModified: new Date("2026-10-16") }));
}
