import type { ReactNode, ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SecondaryNavItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  children: ReactNode;
}

/**
 * Standardized secondary navigation item button.
 *
 * Styling standards:
 * - Padding: py-3 px-3
 * - Active state: bg-accent (light) / bg-accent/60 (dark) with accent foreground text
 * - Hover state: bg-accent/50
 */
export function SecondaryNavItem({
  isActive,
  children,
  className,
  ...props
}: SecondaryNavItemProps): ReactNode {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start h-auto py-3 px-3 rounded-lg whitespace-normal",
        isActive
          ? "bg-accent dark:bg-accent/60 text-accent-foreground"
          : "hover:bg-accent/50",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
