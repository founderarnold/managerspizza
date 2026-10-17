import "server-only";
import { unstable_cache } from "next/cache";
import { DEFAULT_BRANCHES, type Branch, type BranchStatus } from "./branches";
import { supabaseAdmin } from "./supabase-server";

interface BranchRow {
  slug: string;
  name: string;
  city: string;
  province: string;
  region: string;
  address: string | null;
  phones: string[] | null;
  lat: number;
  lng: number;
  is_main: boolean;
  status: BranchStatus;
  created_at: string;
}

const seedOrder = (slug: string) => {
  const i = DEFAULT_BRANCHES.findIndex((b) => b.slug === slug);
  return i < 0 ? DEFAULT_BRANCHES.length : i;
};

/** Every branch in the database, closed ones included. Cached; Admin > Branches clears the "branches" tag on save. */
export const getAllBranches = unstable_cache(
  async (): Promise<Branch[]> => {
    const db = supabaseAdmin();
    if (!db) return DEFAULT_BRANCHES;
    const { data, error } = await db.from("branches").select("*");
    if (error || !data?.length) return DEFAULT_BRANCHES;
    return (data as BranchRow[])
      .sort((a, b) => Number(b.is_main) - Number(a.is_main) || seedOrder(a.slug) - seedOrder(b.slug) || a.created_at.localeCompare(b.created_at))
      .map((r) => ({
        slug: r.slug,
        name: r.name,
        city: r.city,
        province: r.province,
        region: (["Luzon", "Visayas", "Mindanao"].includes(r.region) ? r.region : "Luzon") as Branch["region"],
        lat: r.lat,
        lng: r.lng,
        address: r.address ?? undefined,
        phones: r.phones ?? undefined,
        hq: r.is_main,
        status: r.status,
      }));
  },
  ["branches"],
  { tags: ["branches"], revalidate: 3600 },
);

/** Branches shown to the public and offered in forms (not closed). */
export async function getBranches() {
  return (await getAllBranches()).filter((b) => b.status !== "closed");
}
