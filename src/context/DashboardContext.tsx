import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "./GraphitiContext";
import { Period } from "@/types/dashboard";
import { subDays, startOfDay, endOfDay } from "date-fns";
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

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const startDate = startOfDay(subDays(now, days));
    const endDate = endOfDay(now);

    return {
      validAfter: startDate.toISOString(),
      validBefore: endDate.toISOString(),
    };
  }, [period]);

  // Fetch session stats
  const { data: sessionStats, isLoading, refetch } = useQuery({
    queryKey: ["session-stats-by-day", groupId, dateRange.validAfter, dateRange.validBefore],
    queryFn: () =>
      graphitiService.getSessionStatsByDay(
        groupId,
        undefined,
        undefined,
        dateRange.validAfter,
        dateRange.validBefore
      ),
  });

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
