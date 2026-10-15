import type { PriceSheet } from "@/lib/catalog";
import { formatPeso } from "@/lib/catalog";

export function PriceTable({ sheet }: { sheet: PriceSheet }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[520px] border-collapse text-[15px]">
        <caption className="sr-only">{sheet.name} price list in Philippine pesos, {sheet.unit}</caption>
        <thead>
          <tr className="bg-ink text-white">
            <th scope="col" className="sticky left-0 bg-ink px-4 py-3 text-left font-semibold">{sheet.rowHeader}</th>
            {sheet.columns.map((c) => (
              <th key={c.key} scope="col" className="px-3 py-3 text-right font-semibold">
                <span className="block">{c.label}</span>
                {c.sub && <span className="block text-[11px] font-normal text-white/70">{c.sub}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((r, i) => (
            <tr key={r.key} className={i % 2 ? "bg-cream/60" : "bg-white"}>
              <th scope="row" className={`sticky left-0 px-4 py-3 text-left font-medium ${i % 2 ? "bg-[#fffbf3]" : "bg-white"}`}>
                {r.label}
              </th>
              {r.prices.map((p, j) => (
                <td key={j} className="px-3 py-3 text-right tabular-nums">
                  {p == null ? <span className="text-muted" aria-label="not available">–</span> : formatPeso(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
