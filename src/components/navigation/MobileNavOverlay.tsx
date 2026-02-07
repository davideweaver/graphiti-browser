import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSwipeable } from "react-swipeable";
import { PrimaryNav } from "./PrimaryNav";
import { SecondaryNav } from "./SecondaryNav";
import type { PrimaryNavItem } from "@/lib/navigationConfig";

interface MobileNavOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  activePrimary: string | null;
  pathname: string;
  navigationConfig: PrimaryNavItem[];
  onNavigate: (path: string) => void;
  footer?: React.ReactNode;
  secondaryNav?: React.ReactNode;
}

export function MobileNavOverlay({
  isOpen,
  onClose,
  activePrimary,
  pathname,
  navigationConfig,
  onNavigate,
  footer,
  secondaryNav
}: MobileNavOverlayProps) {
  // Primary nav: navigate but keep sidebar open
  const handlePrimaryNavigate = (path: string) => {
    onNavigate(path);
  };

  // Secondary nav: navigate and close sidebar
  const handleSecondaryNavigate = (path: string) => {
    onNavigate(path);
    onClose();
  };

  // Swipe left to close the nav overlay
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onClose(),
    preventScrollOnSwipe: true,
    trackTouch: true,
    trackMouse: false,
    delta: 50,
  });

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-full !p-0 mobile-nav-sheet"
      >
        {/* Both columns side-by-side */}
        <div
          className="flex h-full"
          {...swipeHandlers}
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <PrimaryNav
            navigationConfig={navigationConfig}
            activePrimary={activePrimary}
            onNavigate={handlePrimaryNavigate}
            footer={footer}
          />
          {secondaryNav || (
            <SecondaryNav
              activePrimary={activePrimary}
              pathname={pathname}
              onNavigate={handleSecondaryNavigate}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
