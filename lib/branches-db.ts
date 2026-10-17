import "server-only";
import { cache } from "react";
import { BRANCHES, type Branch, type BranchStatus } from "./branches";
import { supabaseAdmin } from "./supabase-server";

interface BranchRow {
  slug: string;
  name: string;
  city: string;
  province: string;
  region: Branch["region"];
  address: string | null;
  phones: string[] | null;
  lat: number;
  lng: number;
  is_main: boolean;
  status: BranchStatus;
}

const fromRow = (r: BranchRow): Branch => ({
  slug: r.slug,
  name: r.name,
  city: r.city,
  province: r.province,
  region: r.region,
  lat: r.lat,
  lng: r.lng,
  address: r.address ?? undefined,
  phones: r.phones?.length ? r.phones : undefined,
  hq: r.is_main,
  status: r.status,
});

/** Every branch (including closed), main depot first, from Supabase or the code list. */
export const allBranches = cache(async (): Promise<Branch[]> => {
  const db = supabaseAdmin();
  if (!db) return BRANCHES;
  const { data, error } = await db.from("branches").select("*").order("is_main", { ascending: false }).order("created_at");
  if (error || !data?.length) return BRANCHES;
  return (data as BranchRow[]).map(fromRow);
});

/** Branches shown to the public: open and opening soon. */
export async function publicBranches() {
  return (await allBranches()).filter((b) => (b.status ?? "open") !== "closed");
}
