"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Branch } from "@/lib/branches";

export function BranchMap({ branches, focus }: { branches: Branch[]; focus?: string | null }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markers = useRef<Record<string, import("leaflet").Marker>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const icon = (hq?: boolean) =>
        L.divIcon({
          className: "",
          html: `<span style="display:block;width:${hq ? 34 : 28}px;height:${hq ? 34 : 28}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${hq ? "#B80000" : "#FF0000"};border:3px solid #FFB20F;box-shadow:0 4px 10px rgba(0,0,0,.35)"></span>`,
          iconSize: [hq ? 34 : 28, hq ? 34 : 28],
          iconAnchor: [hq ? 17 : 14, hq ? 34 : 28],
          popupAnchor: [0, -30],
        });
      const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
      for (const b of branches) {
        const m = L.marker([b.lat, b.lng], { icon: icon(b.hq), title: b.name, alt: b.name })
          .addTo(map)
          .bindPopup(
            `<strong>${esc(b.name)}</strong><br>${esc(b.address ?? `${b.city}, ${b.province}`)}${
              b.phones ? `<br>${esc(b.phones.join(" / "))}` : ""
            }<br><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              b.address ?? `${b.city}, ${b.province}, Philippines`,
            )}" target="_blank" rel="noopener">Directions</a>`,
          );
        markers.current[b.slug] = m;
      }
      map.fitBounds(L.latLngBounds(branches.map((b) => [b.lat, b.lng] as [number, number])), { padding: [30, 30] });
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.current = {};
    };
  }, [branches]);

  useEffect(() => {
    if (!focus || !mapRef.current) return;
    const m = markers.current[focus];
    if (m) {
      mapRef.current.flyTo(m.getLatLng(), 12, { duration: 0.6 });
      m.openPopup();
    }
  }, [focus]);

  return <div ref={el} className="h-[440px] w-full overflow-hidden rounded-2xl border border-line bg-sand md:h-[600px]" role="region" aria-label="Map of Manager's Pizza branches" />;
}
