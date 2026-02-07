import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { PrimaryNavItem } from "@/lib/navigationConfig";

interface PrimaryNavProps {
  navigationConfig: PrimaryNavItem[];
  activePrimary: string | null;
  onNavigate: (path: string) => void;
  footer?: React.ReactNode;
}

export function PrimaryNav({ navigationConfig, activePrimary, onNavigate, footer }: PrimaryNavProps) {
  const isMobile = useIsMobile();

  return (
    <nav className="w-[75px] bg-background flex flex-col">
      {/* Header spacer */}
      <div className="h-16 flex items-center justify-center">
        {/* Optional logo or title initial */}
      </div>

      {/* Navigation buttons */}
      <div className="flex-1 flex flex-col gap-4 p-2 pt-6">
        <TooltipProvider delayDuration={300}>
          {navigationConfig.map((item) => {
            const isActive = activePrimary === item.key;
            const button = (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
                onClick={() => onNavigate(item.defaultPath)}
              >
                <item.icon className="h-6 w-6" />
              </Button>
            );

            // Show tooltips only on desktop
            if (isMobile) {
              return <div key={item.key}>{button}</div>;
            }

            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Footer - UserProfileMenu */}
      {footer && (
        <div className="p-2">
          {footer}
        </div>
      )}
    </nav>
  );
}
