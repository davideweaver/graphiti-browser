import type { ReactNode } from "react";
import type React from "react";
import { cn } from "@/lib/utils";

interface SecondaryNavItemTitleProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard title for secondary nav items.
 * Wraps text across up to 2 lines with ellipsis overflow.
 */
export function SecondaryNavItemTitle({ children, className }: SecondaryNavItemTitleProps): ReactNode {
  return (
    <div className={cn("font-medium w-full text-left break-words line-clamp-2", className)}>
      {children}
    </div>
  );
}

interface SecondaryNavItemSubtitleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Standard subtitle/metadata for secondary nav items.
 */
export function SecondaryNavItemSubtitle({ children, className, style }: SecondaryNavItemSubtitleProps): ReactNode {
  return (
    <div className={cn("text-xs text-muted-foreground", className)} style={style}>
      {children}
    </div>
  );
}
