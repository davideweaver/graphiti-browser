import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { DayCard } from "./DayCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, startOfDay, isSameDay, format, startOfWeek } from "date-fns";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";

interface DayNavigationProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dateRange: { start: string; end: string };
}

export function DayNavigation({
  selectedDate,
  onDateSelect,
  dateRange,
}: DayNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { groupId } = useGraphiti();

  // Fetch session stats for the date range
  const { data: statsData } = useQuery({
    queryKey: ["session-stats-by-day", groupId, dateRange.start, dateRange.end],
    queryFn: () => graphitiService.getSessionStatsByDay(
      groupId,
      undefined,
      undefined,
      dateRange.start,
      dateRange.end
    ),
  });

  // Calculate the range of days to show (7 days starting with Monday)
  const [weekStartDate, setWeekStartDate] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  );
  const visibleDays = 7;

  const days = Array.from({ length: visibleDays }, (_, i) =>
    addDays(weekStartDate, i)
  );

  // Get session count for a specific day from API stats
  const getSessionCountForDay = (date: Date) => {
    if (!statsData?.stats) return 0;

    const dateString = format(date, "yyyy-MM-dd");
    const stat = statsData.stats.find(s => s.date === dateString);
    return stat?.count || 0;
  };

  // Scroll functions - navigate by full weeks
  const scrollLeft = () => {
    setWeekStartDate((prev) => addDays(prev, -visibleDays));
  };

  const scrollRight = () => {
    setWeekStartDate((prev) => addDays(prev, visibleDays));
  };

  const today = startOfDay(new Date());

  return (
    <div className="space-y-4">
      {/* Header with date range */}
      <div>
        <h2 className="text-lg font-semibold">
          {format(days[0], "MMM d")} - {format(days[days.length - 1], "MMM d, yyyy")}
        </h2>
      </div>

      {/* Day cards with navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={scrollLeft}
          className="shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
        >
          {days.map((day) => (
            <DayCard
              key={day.toISOString()}
              date={day}
              sessionCount={getSessionCountForDay(day)}
              isSelected={isSameDay(day, selectedDate)}
              isToday={isSameDay(day, today)}
              onClick={() => onDateSelect(startOfDay(day))}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={scrollRight}
          className="shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
