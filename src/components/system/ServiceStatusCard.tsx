import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatusMetric {
  label: string;
  value: string | number;
}

interface ServiceStatusCardProps {
  title: string;
  icon: LucideIcon;
  status: "healthy" | "unhealthy" | "degraded" | "unknown";
  statusLabel?: string;
  metrics?: StatusMetric[];
  actionButton?: {
    label: string;
    onClick: () => void;
  };
  isLoading?: boolean;
}

export function ServiceStatusCard({
  title,
  icon: Icon,
  status,
  statusLabel,
  metrics,
  actionButton,
  isLoading,
}: ServiceStatusCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "healthy":
        return "bg-green-500";
      case "unhealthy":
        return "bg-red-500";
      case "degraded":
        return "bg-yellow-500";
      default:
        return "bg-muted";
    }
  };

  const getStatusVariant = (): "default" | "destructive" | "secondary" => {
    switch (status) {
      case "healthy":
        return "default";
      case "unhealthy":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = () => {
    if (statusLabel) return statusLabel;
    switch (status) {
      case "healthy":
        return "Healthy";
      case "unhealthy":
        return "Offline";
      case "degraded":
        return "Degraded";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${getStatusColor()}`} />
          <Badge variant={getStatusVariant()}>{getStatusText()}</Badge>
        </div>

        {metrics && metrics.length > 0 && (
          <div className="space-y-1">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="flex justify-between text-sm text-muted-foreground"
              >
                <span>{metric.label}:</span>
                <span className="font-medium text-foreground">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {actionButton && (
          <Button
            onClick={actionButton.onClick}
            size="sm"
            className="w-full"
            variant="outline"
          >
            {actionButton.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
