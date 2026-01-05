import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";
import { LoaderCircle } from "lucide-react";

type Props = {
  children: React.ReactElement;
  title: string;
  description: string;
  chartConfig: ChartConfig;
  isLoading?: boolean;
};

const WidgetChart = ({
  children,
  title,
  description,
  chartConfig,
  isLoading,
}: Props) => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="truncate">
          {isLoading && (
            <div className="float-right">
              <LoaderCircle className="animate-spin h-6 w-6 text-muted-foreground" />
            </div>
          )}
          {title}
        </CardTitle>
        <CardDescription className="truncate">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {!isLoading && (
          <ChartContainer config={chartConfig}>{children}</ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default WidgetChart;
