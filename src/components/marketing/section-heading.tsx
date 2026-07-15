import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, description, align = "center", className }: { eyebrow: string; title: string; description?: string; align?: "left" | "center"; className?: string }) {
  return <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}><Badge>{eyebrow}</Badge><h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>{description && <p className="mt-4 text-balance text-muted-foreground sm:text-lg">{description}</p>}</div>;
}
