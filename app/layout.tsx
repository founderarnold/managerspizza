import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TabBar } from "@/components/TabBar";
import { QuoteProvider } from "@/components/QuoteProvider";
import { SITE } from "@/lib/site";
import type { Branch } from "@/lib/branches";
import { allBranches } from "@/lib/branches-db";
import { BranchesProvider } from "@/components/BranchesProvider";
import { SwRegister } from "@/components/SwRegister";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Manager's Pizza | Pizza Supplies, Packages & Partner Programs",
    template: "%s | Manager's Pizza",
  },
  description: SITE.tagline,
  applicationName: "Manager's Pizza",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Manager's Pizza",
    locale: "en_PH",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Manager's Pizza" }],
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "Manager's Pizza", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#FFB20F",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = (branches: Branch[]) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Manager's Pizza",
  url: SITE.url,
  logo: `${SITE.url}/icon-512.png`,
  telephone: "+63 946 697 5253",
  address: { "@type": "PostalAddress", streetAddress: "Villongco St., Commonwealth", addressLocality: "Quezon City", addressCountry: "PH" },
  department: branches
    .filter((b) => (b.status ?? "open") === "open")
    .map((b) => ({
      "@type": "LocalBusiness",
      name: b.name,
      address: { "@type": "PostalAddress", addressLocality: b.city, addressRegion: b.province, addressCountry: "PH", ...(b.address ? { streetAddress: b.address } : {}) },
      geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng },
    })),
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branches = await allBranches();
  return (
    <html lang="en-PH">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <BranchesProvider branches={branches}>
          <QuoteProvider>
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
            <TabBar />
          </QuoteProvider>
        </BranchesProvider>
        <SwRegister />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd(branches)) }} />
      </body>
    </html>
  );
}
