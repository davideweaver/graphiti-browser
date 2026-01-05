import { Period } from "@/types/dashboard";
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
        <SegmentsTrigger value="7d">7d</SegmentsTrigger>
        <SegmentsTrigger value="30d">30d</SegmentsTrigger>
        <SegmentsTrigger value="90d">90d</SegmentsTrigger>
      </SegmentsList>
    </Segments>
  );
};

export default PeriodSelector;
