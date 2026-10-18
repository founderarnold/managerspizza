import { Flame } from "lucide-react";

/** "Continue with FLAME PH": one account for flameph.org, NegosyoDepot, MarketplacePH and Manager's Pizza. */
export function FlameButton({ href, label = "Continue with your FLAME PH account" }: { href: string; label?: string }) {
  return (
    <div className="grid gap-3">
      <a href={href} className="btn w-full bg-brand-yellow text-base text-ink shadow-soft hover:bg-[#ffc53d]">
        <Flame size={20} aria-hidden /> {label}
      </a>
      <p className="text-center text-xs leading-relaxed text-muted">
        One account for flameph.org, NegosyoDepot, MarketplacePH and Manager&apos;s Pizza. You can also sign in there with Google.
      </p>
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted">
        <span className="h-px flex-1 bg-line" /> or with email and password <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
