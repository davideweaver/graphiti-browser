import { SecondaryNavItem } from "@/components/navigation/SecondaryNavItem";
import { navigationConfig } from "@/lib/navigationConfig";

interface SecondaryNavProps {
  activePrimary: string | null;
  pathname: string;
  onNavigate: (path: string) => void;
}

export function SecondaryNav({ activePrimary, pathname, onNavigate }: SecondaryNavProps) {
  const primaryConfig = activePrimary
    ? navigationConfig.find(item => item.key === activePrimary)
    : null;

  const secondaryItems = primaryConfig?.secondaryItems || [];
  const activePrimaryLabel = primaryConfig?.label || "";

  return (
    <nav className="w-[380px] bg-card flex flex-col">
      {/* Header */}
      <div className="pt-4 md:pt-8 px-6 flex items-center">
        <h2 className="font-bold" style={{ fontSize: 28 }}>
          {activePrimaryLabel}
        </h2>
      </div>

      {/* Menu items */}
      <div className="flex-1 overflow-auto p-4">
        {secondaryItems.length > 0 ? (
          <div className="space-y-1">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.path;
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
    </nav>
  );
}
