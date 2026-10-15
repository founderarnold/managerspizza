"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { PriceSheet } from "@/lib/catalog";
import { formatPeso } from "@/lib/catalog";
import { useQuote } from "./QuoteProvider";

export function AddToQuote({ sheet }: { sheet: PriceSheet }) {
  const { add } = useQuote();
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(() => sheet.rows[0].prices.findIndex((p) => p != null));
  const [qty, setQty] = useState(1);
  const r = sheet.rows[row];
  const price = r.prices[col] ?? null;
  const colLabel = (i: number) => {
    const c = sheet.columns[i];
    return [c.label, c.sub].filter(Boolean).join(" · ");
  };

  return (
    <form
      className="card grid gap-4 p-5 sm:grid-cols-[1.4fr_1.4fr_0.6fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        if (price == null) return;
        add(
          {
            id: `${sheet.slug}:${r.key}:${sheet.columns[col].key}`,
            sheet: sheet.slug,
            name: `${sheet.name}: ${r.label}`,
            option: colLabel(col),
            unitPrice: price,
          },
          qty,
        );
      }}
    >
      <label className="label">
        {sheet.rowHeader}
        <select
          className="field"
          value={row}
          onChange={(e) => {
            const next = Number(e.target.value);
            setRow(next);
            if (sheet.rows[next].prices[col] == null) setCol(sheet.rows[next].prices.findIndex((p) => p != null));
          }}
        >
          {sheet.rows.map((x, i) => (
            <option key={x.key} value={i}>{x.label}</option>
          ))}
        </select>
      </label>
      <label className="label">
        Option
        <select className="field" value={col} onChange={(e) => setCol(Number(e.target.value))}>
          {sheet.columns.map((c, i) => (
            <option key={c.key} value={i} disabled={r.prices[i] == null}>
              {colLabel(i)}
              {r.prices[i] != null ? ` · ${formatPeso(r.prices[i]!)}` : " · n/a"}
            </option>
          ))}
        </select>
      </label>
      <label className="label">
        Qty
        <input className="field" type="number" min={1} inputMode="numeric" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
      </label>
      <button type="submit" className="btn-primary" disabled={price == null}>
        <Plus size={18} aria-hidden /> Add to quote
      </button>
    </form>
  );
}
