"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MapPin, Phone } from "lucide-react";
import type { Branch } from "@/lib/branches";

const BranchMap = dynamic(() => import("./BranchMap").then((m) => m.BranchMap), {
  ssr: false,
  loading: () => <div className="h-[440px] w-full animate-pulse rounded-2xl bg-sand md:h-[600px]" aria-hidden />,
});

export function BranchExplorer({ branches }: { branches: Branch[] }) {
  const [focus, setFocus] = useState<string | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <BranchMap branches={branches} focus={focus} />
      <ul className="grid content-start gap-3 lg:max-h-[600px] lg:overflow-y-auto lg:pr-1">
        {branches.map((b) => (
          <li key={b.slug}>
            <button
              type="button"
              onClick={() => {
                setFocus(b.slug);
                if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`card w-full p-4 text-left transition hover:shadow-lift ${focus === b.slug ? "ring-2 ring-brand-yellow" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${b.hq ? "bg-brand-red-deep text-white" : "bg-brand-yellow text-ink"}`}>
                  <MapPin size={16} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{b.city}</span>
                  <span className="block text-sm text-muted">{b.province}</span>
                  {b.address && <span className="mt-1 block text-sm">{b.address}</span>}
                  {b.phones && (
                    <span className="mt-1 inline-flex items-center gap-1 text-sm text-brand-red-deep">
                      <Phone size={13} aria-hidden /> {b.phones.join(" / ")}
                    </span>
                  )}
                  {b.hq && <span className="chip mt-2 bg-brand-yellow-soft">Main depot</span>}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
