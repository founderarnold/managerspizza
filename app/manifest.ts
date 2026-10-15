import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manager's Pizza",
    short_name: "Manager's Pizza",
    description: "Pizza supplies, business packages and partner programs.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF8EC",
    theme_color: "#FFB20F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
