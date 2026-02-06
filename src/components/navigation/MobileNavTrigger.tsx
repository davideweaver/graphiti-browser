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
      className="fixed top-4 left-4 z-40 md:hidden"
      onClick={onClick}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
