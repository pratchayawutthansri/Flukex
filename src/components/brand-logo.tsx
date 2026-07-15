import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandLogo({ href = "/", compact = false, className }: { href?: string; compact?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex min-h-11 items-center gap-2 rounded-lg font-bold tracking-tight", className)} aria-label="Flukex POS หน้าหลัก">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><UtensilsCrossed className="size-5" /></span>
      {!compact && <span className="text-lg">Flukex <span className="text-primary">POS</span></span>}
    </Link>
  );
}
