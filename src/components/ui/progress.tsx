"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ className, value = 0, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator className="h-full bg-primary transition-transform duration-300" style={{ transform: `translateX(-${100 - Math.min(value ?? 0, 100)}%)` }} />
    </ProgressPrimitive.Root>
  );
}
