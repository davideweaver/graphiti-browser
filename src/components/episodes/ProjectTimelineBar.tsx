import { useMemo } from "react";
import { format, differenceInDays, parseISO, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import type { Session } from "@/types/graphiti";

interface ProjectTimelineBarProps {
  sessions: Session[];
  projectStartDate: string; // ISO timestamp
  projectEndDate: string; // ISO timestamp
  className?: string;
}

interface DaySession {
  date: Date;
  sessions: Session[];
  position: number; // Percentage position on timeline
  hasNextDay: boolean; // True if next day also has sessions
  hasPrevDay: boolean; // True if previous day also has sessions
}

export function ProjectTimelineBar({
  sessions,
  projectStartDate,
  projectEndDate,
  className = "",
}: ProjectTimelineBarProps) {
  const navigate = useNavigate();

  const timelineData = useMemo(() => {
    const projectStart = startOfDay(parseISO(projectStartDate));
    const projectEnd = startOfDay(parseISO(projectEndDate));
    const actualDays = differenceInDays(projectEnd, projectStart) + 1;

    // Always show at least 7 days
    const totalDays = Math.max(actualDays, 7);

    // Adjust end date if we're extending the timeline
    const displayEnd = actualDays < 7
      ? new Date(projectStart.getTime() + (6 * 24 * 60 * 60 * 1000)) // Add 6 days to start
      : projectEnd;

    // Group sessions by day
    const sessionsByDay = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const sessionDate = startOfDay(parseISO(session.first_episode_date));
      const dateKey = format(sessionDate, "yyyy-MM-dd");

      if (!sessionsByDay.has(dateKey)) {
        sessionsByDay.set(dateKey, []);
      }
      sessionsByDay.get(dateKey)!.push(session);
    });

    // Create day sessions with position data
    const daySessions: DaySession[] = Array.from(sessionsByDay.entries()).map(([dateKey, daySessions]) => {
      const dayDate = parseISO(dateKey);
      const daysSinceStart = differenceInDays(dayDate, projectStart);
      const position = (daysSinceStart / Math.max(totalDays, 1)) * 100;

      return {
        date: dayDate,
        sessions: daySessions,
        position,
        hasNextDay: false, // Will be calculated after sorting
        hasPrevDay: false, // Will be calculated after sorting
      };
    });

    // Sort by date
    daySessions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate hasNextDay and hasPrevDay for continuous bar rendering
    daySessions.forEach((daySession, index) => {
      if (index > 0) {
        const prevDay = daySessions[index - 1];
        const daysDiff = differenceInDays(daySession.date, prevDay.date);
        if (daysDiff === 1) {
          daySession.hasPrevDay = true;
          prevDay.hasNextDay = true;
        }
      }
    });

    // Calculate smart date markers based on timeline duration
    const getDateMarkers = () => {
      if (totalDays <= 7) {
        // Daily markers - one per day
        return Array.from({ length: totalDays }, (_, i) => {
          const date = new Date(projectStart);
          date.setDate(date.getDate() + i);
          const position = totalDays === 1 ? 50 : (i / (totalDays - 1)) * 100;
          return { date, position };
        });
      } else if (totalDays <= 31) {
        // Weekly markers for month
        return Array.from({ length: 5 }, (_, i) => {
          const date = new Date(projectStart);
          date.setDate(date.getDate() + Math.floor((i * totalDays) / 4));
          return { date, position: (i / 4) * 100 };
        });
      } else if (totalDays <= 90) {
        // Bi-weekly markers for quarter
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(projectStart);
          date.setDate(date.getDate() + Math.floor((i * totalDays) / 6));
          return { date, position: (i / 6) * 100 };
        });
      } else {
        // Monthly markers for longer periods
        const markers: { date: Date; position: number }[] = [];
        let currentDate = new Date(projectStart);
        while (currentDate <= displayEnd) {
          const daysSince = differenceInDays(currentDate, projectStart);
          markers.push({
            date: new Date(currentDate),
            position: (daysSince / totalDays) * 100,
          });
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        return markers;
      }
    };

    return {
      daySessions,
      dateMarkers: getDateMarkers(),
      totalDays,
      displayEnd,
      actualDays,
    };
  }, [sessions, projectStartDate, projectEndDate]);

  const handleDayClick = (daySession: DaySession) => {
    // If only one session, navigate directly to it
    if (daySession.sessions.length === 1) {
      navigate(`/session/${daySession.sessions[0].session_id}`);
    } else {
      // Navigate to the first session (could be enhanced with a picker)
      navigate(`/session/${daySession.sessions[0].session_id}`);
    }
  };

  const formatMarkerDate = (date: Date) => {
    if (timelineData.totalDays <= 7) {
      return format(date, "MMM d");
    } else if (timelineData.totalDays <= 31) {
      return format(date, "MMM d");
    } else if (timelineData.totalDays <= 90) {
      return format(date, "MMM d");
    } else {
      return format(date, "MMM");
    }
  };

  if (timelineData.daySessions.length === 0) {
    return null; // Don't show timeline if no sessions
  }

  return (
    <div className={`mt-6 ${className}`}>
      <div className="text-xs font-medium text-muted-foreground mb-2">
        Activity Timeline
      </div>

      {/* Date markers */}
      <div className="flex justify-between text-[10px] text-muted-foreground mb-1 px-1">
        {timelineData.dateMarkers.map((marker, i) => (
          <span key={i} className="whitespace-nowrap">
            {formatMarkerDate(marker.date)}
          </span>
        ))}
      </div>

      {/* Timeline track */}
      <div className="relative h-3 bg-muted/30 rounded-full overflow-visible">
        {/* Day session bars */}
        {timelineData.daySessions.map((daySession, i) => {
          const sessionCount = daySession.sessions.length;

          // Determine rounded corners based on adjacent days
          const roundedClass =
            daySession.hasPrevDay && daySession.hasNextDay
              ? "" // No rounded corners (middle of continuous bar)
              : daySession.hasPrevDay
              ? "rounded-r-full" // Only round right side (end of continuous bar)
              : daySession.hasNextDay
              ? "rounded-l-full" // Only round left side (start of continuous bar)
              : "rounded-full"; // Round both sides (isolated bar)

          return (
            <div
              key={i}
              className="absolute h-full group cursor-pointer"
              style={{
                left: `${daySession.position}%`,
                width: `${Math.max(100 / Math.max(timelineData.totalDays, 1), 1.5)}%`,
              }}
              onClick={() => handleDayClick(daySession)}
              title={`${format(daySession.date, "MMM d, yyyy")} - ${sessionCount} session${sessionCount > 1 ? "s" : ""}`}
            >
              {/* Bar with blue color */}
              <div
                className={`h-full bg-[#0EA5E9] ${roundedClass} transition-all`}
              >
                <div className={`absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity ${roundedClass}`} />
              </div>

              {/* Badge for session count (if > 1) */}
              {sessionCount > 1 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-6 left-1/2 -translate-x-1/2 h-5 min-w-5 px-1.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-background border"
                >
                  {sessionCount}
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats below */}
      <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2 px-1">
        <span>{format(parseISO(projectStartDate), "MMM d, yyyy")}</span>
        <span>
          {timelineData.daySessions.length} active day{timelineData.daySessions.length !== 1 ? "s" : ""}
        </span>
        <span>{format(parseISO(projectEndDate), "MMM d, yyyy")}</span>
      </div>
    </div>
  );
}
