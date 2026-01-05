import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import useDashboard from "@/hooks/use-dashboard";
import WidgetChart from "./WidgetChart";
import { format, parseISO, eachDayOfInterval, subDays, startOfDay } from "date-fns";

const CHART_CONFIG = {
  sessions: {
    label: "Sessions",
    color: "#0EA5E9",
  },
};

const SessionActivityChart = () => {
  const { sessionStats, isLoading, period } = useDashboard();

  // Calculate the date range for the period
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1));

  // Generate all dates in the range
  const allDates = eachDayOfInterval({ start: startDate, end: endDate });

  // Create a map of existing session counts
  const sessionCountMap = new Map(
    sessionStats?.stats?.map((stat) => [
      format(parseISO(stat.date), "yyyy-MM-dd"),
      stat.count,
    ]) || []
  );

  // Fill in missing days with 0 sessions
  const chartData = allDates.map((date) => ({
    date: format(date, "MMM d"),
    sessions: sessionCountMap.get(format(date, "yyyy-MM-dd")) || 0,
  }));

  return (
    <WidgetChart
      title="Session Activity"
      description="Sessions over time"
      isLoading={isLoading}
      chartConfig={CHART_CONFIG}
    >
      <BarChart
        key={period}
        data={chartData}
        margin={{ top: 5, right: 5, left: -35, bottom: -10 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="sessions"
          name={CHART_CONFIG.sessions.label}
          fill={CHART_CONFIG.sessions.color}
        />
      </BarChart>
    </WidgetChart>
  );
};

export default SessionActivityChart;
