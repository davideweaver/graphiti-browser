import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerToolToggleVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(220_8%_18%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(220_8%_25%)] data-[state=on]:bg-[hsl(220_8%_25%)] dark:bg-[hsl(220_8%_18%)] dark:text-[hsl(210_40%_98%)] dark:hover:bg-[hsl(220_8%_25%)] dark:data-[state=on]:bg-[hsl(220_8%_25%)]",
      },
      size: {
        sm: "h-9 rounded-md px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  }
);

export interface ContainerToolToggleProps
  extends React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>,
    VariantProps<typeof containerToolToggleVariants> {}

const ContainerToolToggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  ContainerToolToggleProps
>(({ className, variant, size, children, pressed, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    pressed={pressed}
    className={cn(containerToolToggleVariants({ variant, size, className }))}
    {...props}
  >
    {children}
  </TogglePrimitive.Root>
));

ContainerToolToggle.displayName = TogglePrimitive.Root.displayName;

// eslint-disable-next-line react-refresh/only-export-components
export { ContainerToolToggle, containerToolToggleVariants };
