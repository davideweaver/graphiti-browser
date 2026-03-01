import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const containerToolButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[hsl(220_8%_18%)] text-[hsl(210_40%_98%)] hover:bg-[hsl(220_8%_25%)] dark:bg-[hsl(220_8%_18%)] dark:text-[hsl(210_40%_98%)] dark:hover:bg-[hsl(220_8%_25%)]",
        primary:
          "bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700",
        destructive:
          "bg-[hsl(220_8%_18%)] text-[hsl(210_40%_98%)] hover:bg-destructive hover:text-destructive-foreground dark:bg-[hsl(220_8%_18%)] dark:text-[hsl(210_40%_98%)] dark:hover:bg-destructive dark:hover:text-destructive-foreground",
        "destructive-solid":
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

export interface ContainerToolButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof containerToolButtonVariants> {
  asChild?: boolean;
}

const ContainerToolButton = React.forwardRef<
  HTMLButtonElement,
  ContainerToolButtonProps
>(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(containerToolButtonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
ContainerToolButton.displayName = "ContainerToolButton";

// eslint-disable-next-line react-refresh/only-export-components
export { ContainerToolButton, containerToolButtonVariants };
