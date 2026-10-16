import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/leads", label: "All requests" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/staff", label: "Staff" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav aria-label="Admin" className="mt-4 flex gap-4 overflow-x-auto border-b border-line">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={active === l.href ? "page" : undefined}
          className={`-mb-px whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold ${active === l.href ? "border-brand-red-deep text-ink" : "border-transparent text-muted hover:text-ink"}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
