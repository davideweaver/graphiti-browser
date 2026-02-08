import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const secondaryNavToolButtonVariants = cva(
  // Base classes with fixed h-10 w-10 sizing
  "inline-flex items-center justify-center h-10 w-10 rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  },
);

export interface SecondaryNavToolButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof secondaryNavToolButtonVariants> {}

export const SecondaryNavToolButton = React.forwardRef<
  HTMLButtonElement,
  SecondaryNavToolButtonProps
>(({ className, variant, ...props }, ref) => {
  return (
    <button
      className={cn(secondaryNavToolButtonVariants({ variant, className }))}
      ref={ref}
      {...props}
    />
  );
});

SecondaryNavToolButton.displayName = "SecondaryNavToolButton";
