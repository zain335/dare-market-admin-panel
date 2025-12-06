import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary/90 text-primary-foreground shadow hover:bg-primary/80 border border-primary",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "text-foreground-light justify-start border border-foreground-lighterborder-foreground-lighter bg-foreground/[0.026]  shadow-sm hover:bg-foreground-lighter hover:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-foreground-lighter hover:text-accent-foreground",
        danger:
          "text-[#ff6369] bg-red-900/20 border border-red-700 hover:bg-red-900/90 hover:text-foreground-lighter hover:font-bold",
        link: "text-primary underline-offset-4 hover:underline hover:text-foreground-light ",
      },
      size: {
        default: "h-9 px-4 py-0",
        sm: "h-8 rounded-md px-3 text-xs py-0",
        lg: "h-10 rounded-md px-8 py-2",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
