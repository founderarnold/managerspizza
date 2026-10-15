import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { QuoteBuilder } from "@/components/QuoteBuilder";

export const metadata: Metadata = {
  title: "Request a Quotation",
  description: "Build a list of Manager's Pizza supplies and send it for a confirmed quotation from the nearest branch.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <PageHero eyebrow="Request a quotation" title="Your quote list">
        Review your items, then tell us where to deliver. The nearest branch confirms prices, stock, shipping and payment terms.
      </PageHero>
      <div className="container-x py-10">
        <QuoteBuilder />
      </div>
    </>
  );
}
