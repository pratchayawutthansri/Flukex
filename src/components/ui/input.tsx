import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  const ariaLabel = props["aria-label"] ?? (!props.id && typeof props.placeholder === "string" ? props.placeholder : undefined);
  return (
    <input
      type={type}
      className={cn("min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className)}
      {...props}
      aria-label={ariaLabel}
    />
  );
}
