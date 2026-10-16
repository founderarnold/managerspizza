export interface Branch {
  slug: string;
  name: string;
  city: string;
  province: string;
  region: "Luzon" | "Visayas" | "Mindanao";
  lat: number;
  lng: number;
  /** Full street address, when published. */
  address?: string;
  phones?: string[];
  hq?: boolean;
}

// Pins for branches without a published street address sit at the city/town centre.
export const BRANCHES: Branch[] = [
  {
    slug: "quezon-city",
    name: "Manager's Pizza Depot Quezon City",
    city: "Quezon City",
    province: "Metro Manila",
    region: "Luzon",
    lat: 14.6997,
    lng: 121.0868,
    address: "Villongco St., Commonwealth, Quezon City",
    phones: ["0946 697 5253", "0999 886 2235"],
    hq: true,
  },
  { slug: "san-fernando-pampanga", name: "Manager's Pizza San Fernando", city: "City of San Fernando", province: "Pampanga", region: "Luzon", lat: 15.0286, lng: 120.6898 },
  { slug: "capas-tarlac", name: "Manager's Pizza Capas", city: "Capas", province: "Tarlac", region: "Luzon", lat: 15.3292, lng: 120.5908 },
  { slug: "imus-cavite", name: "Manager's Pizza Imus", city: "Imus City", province: "Cavite", region: "Luzon", lat: 14.4297, lng: 120.9367 },
  { slug: "calamba-laguna", name: "Manager's Pizza Calamba", city: "Calamba City", province: "Laguna", region: "Luzon", lat: 14.2117, lng: 121.1653 },
  { slug: "naga-camarines-sur", name: "Manager's Pizza Naga", city: "Naga City", province: "Camarines Sur", region: "Luzon", lat: 13.6218, lng: 123.1948 },
  { slug: "cagayan-de-oro", name: "Manager's Pizza Cagayan de Oro", city: "Cagayan de Oro City", province: "Misamis Oriental", region: "Mindanao", lat: 8.4542, lng: 124.6319 },
  { slug: "tangub-city", name: "Manager's Pizza Tangub", city: "Tangub City", province: "Misamis Occidental", region: "Mindanao", lat: 8.0617, lng: 123.75 },
  { slug: "montalban-rizal", name: "Manager's Pizza Montalban", city: "Montalban (Rodriguez)", province: "Rizal", region: "Luzon", lat: 14.7339, lng: 121.1437 },
  { slug: "umingan-pangasinan", name: "Manager's Pizza Umingan", city: "Umingan", province: "Pangasinan", region: "Luzon", lat: 15.9286, lng: 120.8406 },
  { slug: "saguday-quirino", name: "Manager's Pizza Saguday", city: "Saguday", province: "Quirino", region: "Luzon", lat: 16.5394, lng: 121.5636 },
];

export const branchName = (slug: string | null | undefined) => {
  const b = BRANCHES.find((x) => x.slug === slug);
  return b ? `${b.city}, ${b.province}` : "Not assigned";
};
