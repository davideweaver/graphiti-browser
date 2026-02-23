import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  /** Size variant: sm for secondary nav, md for primary nav */
  size?: "sm" | "md";
}

/**
 * Badge component to display unread notification count
 * - Shows count up to 99, displays "99+" for higher counts
 * - Hides when count is 0
 * - Two sizes: sm (secondary nav) and md (primary nav)
 */
export function NotificationBadge({
  count,
  className,
  size = "md",
}: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-500 text-white font-medium",
        size === "sm" && "h-4 w-4 text-[10px] min-w-[16px]",
        size === "md" && "h-5 w-5 text-xs min-w-[20px]",
        // Make width auto for "99+" to accommodate text
        count > 99 && size === "sm" && "w-auto px-1",
        count > 99 && size === "md" && "w-auto px-1.5",
        className
      )}
    >
      {displayCount}
    </div>
  );
}
