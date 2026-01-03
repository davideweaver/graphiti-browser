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
}

export function DayCard({
  date,
  sessionCount,
  isSelected,
  isToday,
  onClick,
}: DayCardProps) {
  const dayName = format(date, "EEE");
  const dayNumber = format(date, "d");

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md min-w-[100px]",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
        isToday && !isSelected && "bg-accent text-accent-foreground",
        !isSelected && !isToday && "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 text-center">
        <div className="text-xs font-medium opacity-80">{dayName}</div>
        <div className="text-2xl font-bold mt-1">{dayNumber}</div>
        {sessionCount > 0 && (
          <Badge
            variant={isSelected ? "secondary" : "default"}
            className="mt-2 text-xs"
          >
            {sessionCount}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
