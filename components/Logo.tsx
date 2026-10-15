import Image from "next/image";
import Link from "next/link";
import logo from "@/public/brand/logo-full-transparent.png";

export function Logo({ className = "h-11 md:h-14 w-auto", priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Link href="/" aria-label="Manager's Pizza home" className="inline-flex shrink-0">
      <Image src={logo} alt="Manager's Pizza" priority={priority} className={className} sizes="(min-width: 768px) 152px, 120px" />
    </Link>
  );
}
