import { useState, ReactNode, ReactElement, cloneElement, isValidElement } from "react";
import { MoreVertical } from "lucide-react";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { MobileBottomDrawer, MobileDrawerButton } from "./MobileBottomDrawer";

interface MobileOverflowMenuProps {
  title: string;
  children: ReactNode;
  disabled?: boolean;
}

/**
 * MobileOverflowMenu - Responsive wrapper for overflow toolbar tools
 *
 * Desktop: Renders children inline (standard behavior)
 * Mobile: Hides children and shows three-dot button that opens a bottom drawer
 *
 * The wrapper automatically converts ContainerToolButton components to drawer
 * menu items. Add a `data-drawer-label` attribute to specify button text in drawer.
 *
 * Usage:
 * Wrap any toolbar tools that should overflow on mobile. For icon buttons,
 * add data-drawer-label to provide text for the drawer menu.
 */
export function MobileOverflowMenu({
  title,
  children,
  disabled = false,
}: MobileOverflowMenuProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Convert children to mobile drawer items
  const mobileDrawerItems: ReactNode[] = [];

  const processChild = (child: ReactNode) => {
    if (!isValidElement(child)) return;

    // Check if it's a ContainerToolButton with data-drawer-label
    if (child.type === ContainerToolButton && child.props['data-drawer-label']) {
      const label = child.props['data-drawer-label'];
      const icon = child.props.children;
      const onClick = child.props.onClick;
      const variant = child.props.variant;

      mobileDrawerItems.push(
        <MobileDrawerButton
          key={mobileDrawerItems.length}
          onClick={() => {
            onClick?.();
            setTimeout(() => setDrawerOpen(false), 100);
          }}
          icon={icon}
          className={variant === 'destructive' ? 'text-destructive hover:text-destructive' : ''}
        >
          {label}
        </MobileDrawerButton>
      );
    }
    // If it's already a MobileDrawerButton, wrap onClick to add close logic
    else if (child.type === MobileDrawerButton) {
      const originalOnClick = child.props.onClick;
      const wrappedButton = cloneElement(child as ReactElement, {
        onClick: () => {
          originalOnClick?.();
          setTimeout(() => setDrawerOpen(false), 100);
        },
        key: mobileDrawerItems.length,
      });
      mobileDrawerItems.push(wrappedButton);
    }
    // Recursively process children
    else if (child.props?.children) {
      const childArray = Array.isArray(child.props.children)
        ? child.props.children
        : [child.props.children];
      childArray.forEach(processChild);
    }
  };

  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(processChild);

  return (
    <>
      {/* Desktop: Show children inline */}
      <div className="hidden md:contents">{children}</div>

      {/* Mobile: Show overflow button */}
      <div className="md:hidden">
        <ContainerToolButton
          size="icon"
          disabled={disabled}
          onClick={() => setDrawerOpen(true)}
        >
          <MoreVertical className="h-4 w-4" />
        </ContainerToolButton>

        <MobileBottomDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title={title}
        >
          {mobileDrawerItems}
        </MobileBottomDrawer>
      </div>
    </>
  );
}
