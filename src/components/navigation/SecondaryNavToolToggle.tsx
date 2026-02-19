import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const secondaryNavToolToggleVariants = cva(
  // Base classes matching SecondaryNavToolButton with fixed h-10 w-10 sizing
  "inline-flex items-center justify-center h-10 w-10 rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        ghost:
          "hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "ghost",
    },
  }
);

export interface SecondaryNavToolToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof secondaryNavToolToggleVariants> {}

export const SecondaryNavToolToggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  SecondaryNavToolToggleProps
>(({ className, variant, ...props }, ref) => {
  return (
    <TogglePrimitive.Root
      ref={ref}
      className={cn(secondaryNavToolToggleVariants({ variant, className }))}
      {...props}
    />
  );
});

SecondaryNavToolToggle.displayName = TogglePrimitive.Root.displayName;
