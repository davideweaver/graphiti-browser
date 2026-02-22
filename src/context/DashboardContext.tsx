import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "./GraphitiContext";
import type { Period } from "@/types/dashboard";
import { subDays, startOfDay, endOfDay, format } from "date-fns";
import type { SessionStatsByDay } from "@/types/graphiti";

interface DashboardContextType {
  sessionStats: SessionStatsByDay | null;
  isLoading: boolean;
  period: Period;
  setPeriod: (period: Period) => void;
  refetch: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

interface DashboardProviderProps {
  children: React.ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
}) => {
  const { groupId } = useGraphiti();
  const [period, setPeriod] = useState<Period>("7d");

  // Fetch all sessions (not filtered by date - we compute local stats ourselves)
  const { data: sessionsResponse, isLoading, refetch } = useQuery({
    queryKey: ["sessions", groupId],
    queryFn: () => graphitiService.listSessions(
      groupId,
      500,
      undefined, // cursor
      undefined, // search
      undefined, // projectName
      undefined, // createdAfter
      undefined, // createdBefore
      undefined, // validAfter (don't filter - we need true session dates!)
      undefined, // validBefore (don't filter - we need true session dates!)
      'desc' // sortOrder
    ),
  });

  // Compute session stats in local timezone
  const sessionStats = useMemo<SessionStatsByDay | null>(() => {
    if (!sessionsResponse?.sessions) return null;

    // Calculate date range for filtering based on period
    const now = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = startOfDay(subDays(now, days));
    const endDate = endOfDay(now);

    // Count sessions by local date
    const statsByDate = new Map<string, number>();

    sessionsResponse.sessions.forEach((session) => {
      // Convert UTC timestamp to local date
      const lastEpisodeDate = new Date(session.last_episode_date);

      // Only count sessions within the selected period
      if (lastEpisodeDate >= startDate && lastEpisodeDate <= endDate) {
        const localDateString = format(lastEpisodeDate, 'yyyy-MM-dd');
        statsByDate.set(localDateString, (statsByDate.get(localDateString) || 0) + 1);
      }
    });

    // Convert to array format expected by SessionStatsByDay
    const stats = Array.from(statsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      stats,
      total_days: stats.length,
    };
  }, [sessionsResponse, period]);

  // Wrap refetch in useCallback to maintain stable reference
  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const dashboardContext = useMemo(
    () => ({
      sessionStats: sessionStats || null,
      isLoading,
      period,
      setPeriod,
      refetch: stableRefetch,
    }),
    [sessionStats, isLoading, period, stableRefetch]
  );

  return (
    <DashboardContext.Provider value={dashboardContext}>
      {children}
    </DashboardContext.Provider>
  );
};

export default DashboardContext;
