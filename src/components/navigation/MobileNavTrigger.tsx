import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface MobileNavTriggerProps {
  onClick: () => void;
}

export function MobileNavTrigger({ onClick }: MobileNavTriggerProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="fixed left-4 -ml-2 z-40 md:hidden h-12 w-12 p-0 backdrop-blur-md !bg-white/10 dark:!bg-black/10 hover:!bg-white/30 dark:hover:!bg-black/30 [&_svg]:!size-[25px]"
      style={{ top: "calc(1rem + env(safe-area-inset-top))" }}
      onClick={onClick}
    >
      <Menu />
    </Button>
  );
}
