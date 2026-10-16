import Link from "next/link";
import { LEAD_STATUSES, STATUS_LABEL } from "@/lib/leads";

/** Status filter chips that keep the other query params. */
export function StatusFilter({ base, params, active }: { base: string; params: Record<string, string | undefined>; active?: string }) {
  const href = (status?: string) => {
    const q = new URLSearchParams(Object.entries({ ...params, status }).filter(([, v]) => v) as [string, string][]);
    return `${base}${q.size ? `?${q}` : ""}`;
  };
  const chips = [{ id: undefined, label: "All open" }, ...LEAD_STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] })), { id: "all", label: "Everything" }];
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <Link
          key={c.label}
          href={href(c.id)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${active === c.id ? "bg-ink text-white" : "bg-white text-graphite shadow-soft hover:bg-sand"}`}
        >
          {c.label}
        </Link>
      ))}
    </div>
  );
}

export const OPEN_STATUSES = ["new", "in_review", "quoted", "accepted"];
