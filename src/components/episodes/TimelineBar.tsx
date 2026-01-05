import { useMemo } from "react";
import { format, differenceInMinutes } from "date-fns";

interface TimelineBarProps {
  startTime: string; // ISO timestamp
  endTime: string; // ISO timestamp
  showHourMarkers?: boolean;
  showTimeLabels?: boolean; // Show start/duration/end below the bar
  className?: string;
}

export function TimelineBar({
  startTime,
  endTime,
  showHourMarkers = true,
  showTimeLabels = false,
  className = "",
}: TimelineBarProps) {
  const timelineData = useMemo(() => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Get hours and minutes as decimal (0-24)
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;

    // Calculate position and width as percentage of 24 hours
    const leftPercent = (startHour / 24) * 100;
    const widthPercent = ((endHour - startHour) / 24) * 100;

    // Calculate duration
    const durationMins = differenceInMinutes(end, start);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const durationText =
      hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    // Determine time of day color
    const getTimeOfDayColor = (hour: number) => {
      if (hour >= 6 && hour < 12) return "from-blue-400 to-blue-500"; // Morning
      if (hour >= 12 && hour < 18) return "from-amber-400 to-amber-500"; // Afternoon
      if (hour >= 18 && hour < 22) return "from-orange-400 to-purple-500"; // Evening
      return "from-indigo-500 to-indigo-600"; // Night
    };

    const gradientColor = getTimeOfDayColor(startHour);

    return {
      leftPercent,
      widthPercent,
      durationText,
      gradientColor,
      startFormatted: format(start, "h:mm a"),
      endFormatted: format(end, "h:mm a"),
    };
  }, [startTime, endTime]);

  return (
    <div className={`relative ${className}`}>
      {/* Hour markers */}
      {showHourMarkers && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1 px-1">
          <span>12am</span>
          <span>6am</span>
          <span>12pm</span>
          <span>6pm</span>
          <span>12am</span>
        </div>
      )}

      {/* Timeline track */}
      <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
        {/* Active bar */}
        <div
          className={`absolute h-full bg-gradient-to-r ${timelineData.gradientColor} rounded-full transition-all group cursor-pointer`}
          style={{
            left: `${timelineData.leftPercent}%`,
            width: `${Math.max(timelineData.widthPercent, 1)}%`,
          }}
          title={`${timelineData.startFormatted} - ${timelineData.endFormatted} (${timelineData.durationText})`}
        >
          {/* Hover effect - make bar slightly taller */}
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Optional: Time and duration text below */}
      {showTimeLabels && (
        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1 px-1">
          <span>{timelineData.startFormatted}</span>
          <span className="text-[10px]">{timelineData.durationText}</span>
          <span>{timelineData.endFormatted}</span>
        </div>
      )}
    </div>
  );
}
