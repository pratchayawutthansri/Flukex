import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold", {
  variants: {
    variant: {
      default: "border-transparent bg-primary/10 text-primary",
      secondary: "border-transparent bg-muted text-muted-foreground",
      success: "border-transparent bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
      warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
      danger: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
      outline: "border-border text-foreground",
    },
  },
  defaultVariants: { variant: "default" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
