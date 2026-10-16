import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/admin", "/branch", "/leads", "/auth/"] }], sitemap: "https://www.managerspizza.com/sitemap.xml" };
}
