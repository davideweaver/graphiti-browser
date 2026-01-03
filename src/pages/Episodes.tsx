import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DayNavigation } from "@/components/episodes/DayNavigation";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, isSameDay, addDays, subDays, parse } from "date-fns";
import { parseSourceDescription } from "@/lib/utils";
import type { Session } from "@/types/graphiti";

export default function Episodes() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize selected date from query string or default to today
  const [selectedDate, setSelectedDate] = useState(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      try {
        // Parse date string in local timezone using date-fns
        const parsed = parse(dateParam, 'yyyy-MM-dd', new Date());
        return isNaN(parsed.getTime()) ? startOfDay(new Date()) : startOfDay(parsed);
      } catch {
        return startOfDay(new Date());
      }
    }
    return startOfDay(new Date());
  });

  const [calendarOpen, setCalendarOpen] = useState(false);
  const queryClient = useQueryClient();

  // Update query string when date changes
  useEffect(() => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    setSearchParams({ date: dateString }, { replace: true });
  }, [selectedDate, setSearchParams]);

  // Calculate date range for API query (fetch 30 days before and after selected date for DayNavigation)
  const rangeStartDate = startOfDay(subDays(selectedDate, 30)).toISOString();
  const rangeEndDate = endOfDay(addDays(selectedDate, 30)).toISOString();

  const { data: sessionsResponse, isLoading } = useQuery({
    queryKey: ["sessions", groupId, rangeStartDate, rangeEndDate],
    queryFn: () => graphitiService.listSessions(
      groupId,
      500,
      undefined,
      undefined,
      undefined,
      rangeStartDate,
      rangeEndDate,
      'desc'
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => graphitiService.deleteEpisode(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["episodes"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session-stats-by-day"] });
      toast.success("Episode deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete episode: " + (error as Error).message);
    },
  });

  // Handle calendar date selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const normalizedDate = startOfDay(date);
      setSelectedDate(normalizedDate);
      setCalendarOpen(false);
    }
  };

  const handleTodayClick = () => {
    const today = startOfDay(new Date());
    setSelectedDate(today);
    setCalendarOpen(false);
  };

  const viewSessionDetail = (sessionId: string) => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    navigate(`/sessions/${encodeURIComponent(sessionId)}?date=${dateString}`);
  };

  // Filter sessions to only show the selected date
  const filteredSessions = useMemo(() => {
    if (!sessionsResponse?.sessions) return [];

    return sessionsResponse.sessions.filter((session) =>
      isSameDay(new Date(session.last_episode_date), selectedDate)
    );
  }, [sessionsResponse, selectedDate]);

  // Calendar picker button for Container tools
  const calendarTools = (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={8}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleCalendarSelect}
        />
        <div className="p-3 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleTodayClick}
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <Container
      title="Sessions"
      description="Browse your conversation sessions"
      loading={isLoading}
      tools={calendarTools}
    >
      <div className="max-w-4xl space-y-6">
        {/* Day Navigation */}
        {sessionsResponse && sessionsResponse.sessions.length > 0 && (
          <DayNavigation
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            dateRange={{ start: rangeStartDate, end: rangeEndDate }}
          />
        )}

        {/* Session Groups */}
        <div className="mt-8">
          {isLoading && (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-6 w-32 mb-3" />
                  <Card>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/4" />
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}

          {!isLoading && sessionsResponse && sessionsResponse.sessions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                <p className="text-muted-foreground">
                  Add your first memory to get started.
                </p>
              </CardContent>
            </Card>
          )}

          {!isLoading && filteredSessions.length > 0 && (
            <div className="space-y-4">
              {filteredSessions.map((session, sessionIndex) => {
                // Use session metadata directly from API
                const minDate = new Date(session.first_episode_date);
                const maxDate = new Date(session.last_episode_date);
                const sameDay =
                  format(minDate, "yyyy-MM-dd") ===
                  format(maxDate, "yyyy-MM-dd");

                const dateRange = sameDay
                  ? format(minDate, "MMM d, yyyy")
                  : format(minDate, "MMM d") === format(maxDate, "MMM d")
                  ? format(minDate, "MMM d, yyyy")
                  : format(minDate, "yyyy") === format(maxDate, "yyyy")
                  ? `${format(minDate, "MMM d")} - ${format(
                      maxDate,
                      "MMM d, yyyy"
                    )}`
                  : `${format(minDate, "MMM d, yyyy")} - ${format(
                      maxDate,
                      "MMM d, yyyy"
                    )}`;

                const timeRange = `${format(minDate, "h:mm a")} - ${format(maxDate, "h:mm a")}`;

                // Parse source_description for app/folder metadata
                const parsed = parseSourceDescription(session.source_descriptions[0] || "");
                const app = parsed?.app || "Unknown";
                const folder = parsed?.folder || "Unknown";

                return (
                  <div key={session.session_id}>
                    <div
                      className="bg-background py-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
                      onClick={() => viewSessionDetail(session.session_id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-semibold">
                              {folder}
                            </h3>
                            <span className="text-sm text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {dateRange}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {app} • {timeRange} • {session.episode_count} episode
                            {session.episode_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {sessionIndex < filteredSessions.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
