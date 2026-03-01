import { X } from "lucide-react";
import type { ReactNode } from "react";

interface MobileBottomDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

/**
 * MobileBottomDrawer - A non-portaled bottom drawer for mobile devices
 *
 * This component renders directly in the DOM tree (not portaled) to preserve
 * "trusted user gesture" status for secure APIs like clipboard access.
 *
 * Use this instead of Radix UI Sheet when you need:
 * - Clipboard operations
 * - Other secure browser APIs that require user gesture context
 * - Better mobile compatibility for critical actions
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <MobileBottomDrawer
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Copy Options"
 * >
 *   <button onClick={() => { doAction(); setOpen(false); }}>
 *     Action 1
 *   </button>
 *   <button onClick={() => { doAction(); setOpen(false); }}>
 *     Action 2
 *   </button>
 * </MobileBottomDrawer>
 * ```
 */
export function MobileBottomDrawer({
  open,
  onOpenChange,
  title,
  children,
}: MobileBottomDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer content */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t rounded-t-lg animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 rounded-md hover:bg-accent flex items-center justify-center text-gray-400 hover:text-gray-300"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col p-2 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileDrawerButtonProps {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * MobileDrawerButton - Styled button for use inside MobileBottomDrawer
 *
 * Provides consistent styling for drawer action buttons with:
 * - Clean borderless design
 * - Hover states
 * - Icon + text layout
 * - Accessibility
 *
 * @example
 * ```tsx
 * <MobileDrawerButton
 *   onClick={() => handleCopy()}
 *   icon={<Copy className="h-4 w-4" />}
 * >
 *   Copy content
 * </MobileDrawerButton>
 * ```
 */
export function MobileDrawerButton({
  onClick,
  icon,
  children,
  className = "",
}: MobileDrawerButtonProps) {
  return (
    <button
      className={`w-full justify-start h-12 px-4 rounded-md hover:bg-accent text-left flex items-center transition-colors ${className}`}
      onClick={onClick}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
}
