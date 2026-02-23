import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ReactNode } from "react";

interface SidePanelHeaderProps {
  title: string | ReactNode;
  description?: string | ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
  headerClassName?: string;
  /** Optional action button(s) to display in the title row (e.g., copy, download) */
  action?: ReactNode;
}

/**
 * Standardized header for all side panels (Sheets).
 *
 * Design specs from NotificationDetailSheet:
 * - Title: text-xl font-semibold, pr-8 for close button clearance
 * - Description: text-sm text-muted-foreground
 * - Left-aligned content (controlled by SheetHeader)
 * - Optional action buttons in title row
 *
 * Usage:
 * ```tsx
 * <SheetContent>
 *   <SidePanelHeader
 *     title="Notification Title"
 *     description="Read 2 hours ago"
 *   />
 *   {/* Panel content *\/}
 * </SheetContent>
 * ```
 *
 * With action button:
 * ```tsx
 * <SidePanelHeader
 *   title="Agent Execution Trace"
 *   action={<Button onClick={handleCopy}>Copy</Button>}
 * />
 * ```
 */
export function SidePanelHeader({
  title,
  description,
  titleClassName = "",
  descriptionClassName = "",
  headerClassName = "",
  action,
}: SidePanelHeaderProps) {
  return (
    <SheetHeader className={headerClassName}>
      <SheetTitle className={`text-xl pr-8 ${action ? "flex items-center justify-between" : ""} ${titleClassName}`}>
        {action ? (
          <>
            <span>{title}</span>
            {action}
          </>
        ) : (
          title
        )}
      </SheetTitle>
      {description && (
        <SheetDescription className={descriptionClassName}>
          {description}
        </SheetDescription>
      )}
    </SheetHeader>
  );
}
