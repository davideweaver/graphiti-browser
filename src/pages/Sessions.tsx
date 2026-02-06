import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Toggle } from "@/components/ui/toggle";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DayNavigation } from "@/components/episodes/DayNavigation";
import { SessionRow } from "@/components/episodes/SessionRow";
import { CalendarIcon, FolderKanban, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, endOfDay, isSameDay, addDays, subDays, parse, differenceInMinutes } from "date-fns";
import type { Session } from "@/types/graphiti";

export default function Sessions() {
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { projectName } = useParams<{ projectName?: string }>();
  const decodedProjectName = projectName ? decodeURIComponent(projectName) : undefined;

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
  const [groupByProject, setGroupByProject] = useState(true); // Default to grouped
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set()); // Track open projects
  const queryClient = useQueryClient();

  // Update query string when date changes
  useEffect(() => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    setSearchParams({ date: dateString }, { replace: true });
  }, [selectedDate, setSearchParams]);

  // Reset to today when graph changes
  useEffect(() => {
    setSelectedDate(startOfDay(new Date()));
    setOpenProjects(new Set());
  }, [groupId]);

  // Calculate date range for stats API query (DayNavigation calendar)
  const rangeStartDate = startOfDay(subDays(selectedDate, 30)).toISOString();
  const rangeEndDate = endOfDay(addDays(selectedDate, 30)).toISOString();

  // Fetch all sessions WITHOUT date filters to get true first/last episode dates
  // Date filtering happens on the frontend to avoid backend returning filtered dates
  // Filter by project if projectName is provided from route params
  const { data: sessionsResponse, isLoading } = useQuery({
    queryKey: ["sessions", groupId, decodedProjectName],
    queryFn: () => graphitiService.listSessions(
      groupId,
      500,
      undefined, // cursor
      undefined, // search
      decodedProjectName, // projectName - filter when viewing project-specific sessions
      undefined, // createdAfter
      undefined, // createdBefore
      undefined, // validAfter (don't filter - we need true session dates!)
      undefined, // validBefore (don't filter - we need true session dates!)
      'desc' // sortOrder
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
    // Navigate to project-specific or memory-specific session detail based on context
    if (decodedProjectName) {
      navigate(`/project/${encodeURIComponent(decodedProjectName)}/sessions/${encodeURIComponent(sessionId)}?date=${dateString}`);
    } else {
      navigate(`/memory/sessions/${encodeURIComponent(sessionId)}?date=${dateString}`);
    }
  };

  const toggleProject = (project: string) => {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(project)) {
        next.delete(project);
      } else {
        next.add(project);
      }
      return next;
    });
  };

  // Compute session counts by local date (for calendar)
  const localSessionStats = useMemo(() => {
    if (!sessionsResponse?.sessions) return new Map<string, number>();

    const stats = new Map<string, number>();

    sessionsResponse.sessions.forEach((session) => {
      // Convert UTC timestamp to local date
      const lastEpisodeDate = new Date(session.last_episode_date);
      const localDateString = format(lastEpisodeDate, 'yyyy-MM-dd');

      stats.set(localDateString, (stats.get(localDateString) || 0) + 1);
    });

    return stats;
  }, [sessionsResponse]);

  // Filter sessions to only show the selected date
  const filteredSessions = useMemo(() => {
    if (!sessionsResponse?.sessions) return [];

    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

    return sessionsResponse.sessions.filter((session) => {
      // Convert UTC timestamp to local date for comparison
      // This ensures sessions are grouped by when they occurred in the user's timezone
      const lastEpisodeDate = new Date(session.last_episode_date);
      const localDateString = format(lastEpisodeDate, 'yyyy-MM-dd');
      return localDateString === selectedDateString;
    });
  }, [sessionsResponse, selectedDate]);

  // Group sessions by project when enabled
  const groupedSessions = useMemo(() => {
    if (!groupByProject) return null;

    const groups = new Map<string, Session[]>();

    filteredSessions.forEach((session) => {
      const projectName = session.project_name || "Unknown Project";

      if (!groups.has(projectName)) {
        groups.set(projectName, []);
      }
      groups.get(projectName)!.push(session);
    });

    // Sort projects alphabetically, but put "Unknown Project" at the end
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "Unknown Project") return 1;
      if (b === "Unknown Project") return -1;
      return a.localeCompare(b);
    });
  }, [filteredSessions, groupByProject]);

  // Initialize only first project as open when groupedSessions changes
  useEffect(() => {
    if (groupedSessions && groupedSessions.length > 0) {
      const firstProject = groupedSessions[0][0];
      setOpenProjects(new Set([firstProject]));
    }
  }, [groupedSessions]);

  // Toolbar buttons for Container tools
  const calendarTools = (
    <div className="flex items-center gap-2">
      <Toggle
        variant="outline"
        size="default"
        pressed={groupByProject}
        onPressedChange={setGroupByProject}
        aria-label="Group by project"
      >
        <FolderKanban className="h-4 w-4 mr-2" />
        Group by Project
      </Toggle>
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
    </div>
  );

  return (
    <Container
      title={decodedProjectName ? `${decodedProjectName} Sessions` : "Sessions"}
      description={decodedProjectName ? `Sessions for ${decodedProjectName} project` : "Browse your conversation sessions"}
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
            localStats={localSessionStats}
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

          {!isLoading && filteredSessions.length > 0 && groupByProject && groupedSessions && (
            <div className="space-y-6">
              {groupedSessions.map(([project, sessions]) => {
                const isOpen = openProjects.has(project);
                return (
                  <Collapsible key={project} open={isOpen} onOpenChange={() => toggleProject(project)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors">
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            isOpen ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                        <FolderKanban className="h-5 w-5" />
                        <h2 className="text-xl font-bold">
                          {project}
                        </h2>
                        <span className="text-sm font-normal text-muted-foreground">
                          ({sessions.length})
                        </span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="space-y-4 mt-3">
                        {sessions.map((session, sessionIndex) => (
                          <div key={session.session_id}>
                            <SessionRow
                              session={session}
                              showProject={false}
                              onSessionClick={viewSessionDetail}
                            />
                            {sessionIndex < sessions.length - 1 && (
                              <Separator className="mt-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}

          {!isLoading && filteredSessions.length > 0 && !groupByProject && (
            <div className="space-y-4">
              {filteredSessions.map((session, sessionIndex) => (
                <div key={session.session_id}>
                  <SessionRow
                    session={session}
                    showProject={true}
                    onSessionClick={viewSessionDetail}
                  />
                  {sessionIndex < filteredSessions.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
