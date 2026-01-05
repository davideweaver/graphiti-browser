import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DayCardProps {
  date: Date;
  sessionCount: number;
  isSelected: boolean;
  isToday: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function DayCard({
  date,
  sessionCount,
  isSelected,
  isToday,
  onClick,
  compact = false,
}: DayCardProps) {
  const dayName = format(date, compact ? "EEEEE" : "EEE"); // Single letter on mobile, 3 letters on desktop
  const dayNumber = format(date, "d");

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        compact ? "min-w-[48px] flex-1" : "min-w-[100px]",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        isToday && !isSelected && "bg-accent text-accent-foreground",
        !isSelected && !isToday && "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardContent className={cn("text-center", compact ? "p-1.5 px-1" : "p-3")}>
        <div className={cn("font-medium opacity-80 uppercase", compact ? "text-[9px]" : "text-xs")}>
          {dayName}
        </div>
        <div className={cn("font-bold", compact ? "text-lg mt-0" : "text-2xl mt-1")}>
          {dayNumber}
        </div>
        {sessionCount > 0 && (
          <Badge
            variant={isSelected ? "secondary" : "default"}
            className={cn(compact ? "mt-0.5 text-[9px] px-1 py-0 h-3.5" : "mt-2 text-xs")}
          >
            {sessionCount}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
