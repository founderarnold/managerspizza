import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  async redirects() {
    return [
      // Old Google Sites pages
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/catalog", destination: "/shop", permanent: true },
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/price-list", destination: "/shop", permanent: true },
      { source: "/franchise", destination: "/start-a-business", permanent: true },
      { source: "/contact-us", destination: "/about#contact", permanent: true },
      { source: "/map", destination: "/branches", permanent: true },
      { source: "/locations", destination: "/branches", permanent: true },
      // Program split into Distributor and Reseller & Retailer
      { source: "/partners/distributor-reseller", destination: "/partners/distributor", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
