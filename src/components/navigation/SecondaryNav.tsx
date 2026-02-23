import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import { SecondaryNavContainer } from "@/components/navigation/SecondaryNavContainer";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { navigationConfig } from "@/lib/navigationConfig";
import { useUnreadNotificationCount } from "@/hooks/use-unread-notification-count";

interface SecondaryNavProps {
  activePrimary: string | null;
  pathname: string;
  onNavigate: (path: string) => void;
}

export function SecondaryNav({ activePrimary, pathname, onNavigate }: SecondaryNavProps) {
  const { unreadCount } = useUnreadNotificationCount();
  const primaryConfig = activePrimary
    ? navigationConfig.find(item => item.key === activePrimary)
    : null;

  const secondaryItems = primaryConfig?.secondaryItems || [];
  const activePrimaryLabel = primaryConfig?.label || "";

  return (
    <SecondaryNavContainer title={activePrimaryLabel}>
      {/* Menu items */}
      <div className="flex-1 overflow-auto p-4">
        {secondaryItems.length > 0 ? (
          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.path;
              const isNotificationsItem = item.path === "/home/notifications";
              return (
                <SecondaryNavItem
                  key={item.path}
                  isActive={isActive}
                  onClick={() => onNavigate(item.path)}
                  className="gap-3 h-11"
                >
                  <item.icon className="h-5 w-5" />
                  <span className={isActive ? "font-medium" : ""}>
                    {item.label}
                  </span>
                  {isNotificationsItem && unreadCount > 0 && (
                    <NotificationBadge count={unreadCount} size="sm" className="ml-auto" />
                  )}
                </SecondaryNavItem>
              );
            })}
          </div>
        ) : (
          // Empty state - space reserved but no items
          <div className="text-sm text-muted-foreground text-center py-8">
            {/* Space reserved for future content */}
          </div>
        )}
      </div>
    </SecondaryNavContainer>
  );
}
