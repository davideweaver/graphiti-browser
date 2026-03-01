import React, { useState, cloneElement, isValidElement } from "react";
import type { ReactNode, ReactElement } from "react";
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

    const childElement = child as ReactElement<Record<string, unknown>>;
    const childProps = childElement.props;

    // Check if it's a ContainerToolButton with data-drawer-label
    if (childElement.type === ContainerToolButton && childProps['data-drawer-label']) {
      const label = childProps['data-drawer-label'] as ReactNode;
      const icon = childProps.children as ReactNode;
      const onClick = childProps.onClick as (() => void) | undefined;
      const variant = childProps.variant as string | undefined;

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
    else if (childElement.type === MobileDrawerButton) {
      const originalOnClick = childProps.onClick as (() => void) | undefined;
      const wrappedButton = cloneElement(
        childElement as ReactElement<{ onClick?: () => void; key?: React.Key }>,
        {
          onClick: () => {
            originalOnClick?.();
            setTimeout(() => setDrawerOpen(false), 100);
          },
          key: mobileDrawerItems.length,
        }
      );
      mobileDrawerItems.push(wrappedButton);
    }
    // Recursively process children
    else if (childProps.children) {
      const nestedChildren = childProps.children as ReactNode | ReactNode[];
      const childArray = Array.isArray(nestedChildren) ? nestedChildren : [nestedChildren];
      childArray.forEach(processChild);
    }
  };

  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(processChild);

  // Desktop: filter out MobileDrawerButton elements (mobile-only, only belong in the drawer)
  const desktopChildren = childArray.filter(child => {
    if (!isValidElement(child)) return true;
    return (child as ReactElement).type !== MobileDrawerButton;
  });

  return (
    <>
      {/* Desktop: Show children inline, excluding mobile-only MobileDrawerButton items */}
      <div className="hidden md:contents">{desktopChildren}</div>

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
