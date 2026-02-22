import type { Period } from "@/types/dashboard";
import { PERIOD_OPTIONS } from "@/types/dashboard";
import { SegmentsList, SegmentsTrigger, Segments } from "@/components/ui/segments";
import useDashboard from "@/hooks/use-dashboard";

const PeriodSelector = () => {
  const { period, setPeriod } = useDashboard();
  return (
    <Segments
      value={period}
      onValueChange={(value) => setPeriod(value as Period)}
      className="space-y-4"
    >
      <SegmentsList>
        {PERIOD_OPTIONS.map((p) => (
          <SegmentsTrigger key={p} value={p}>{p}</SegmentsTrigger>
        ))}
      </SegmentsList>
    </Segments>
  );
};

export default PeriodSelector;
