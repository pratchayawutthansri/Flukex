import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background,color,border-color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        accent: "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/75",
        outline: "border border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary/50",
        ghost: "text-foreground hover:bg-muted",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
      },
      size: {
        sm: "min-h-11 rounded-md px-3 text-xs",
        default: "min-h-11 px-4",
        lg: "min-h-12 rounded-xl px-6 text-base",
        icon: "size-11 min-h-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
