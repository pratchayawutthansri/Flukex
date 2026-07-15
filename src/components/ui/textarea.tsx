import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("min-h-24 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground/70 md:text-sm", className)} {...props} />;
}
