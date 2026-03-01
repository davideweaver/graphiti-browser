import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { xerroService } from "@/api/xerroService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollText, Pause, Play, ChevronLeft } from "lucide-react";

export default function XerroLogs() {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const [level, setLevel] = useState<string>("all");
  const limit = 100;

  // Poll for xerro logs
  const { data: xerroLogs, isLoading } = useQuery({
    queryKey: ["xerro-logs", level === "all" ? undefined : level, limit],
    queryFn: () =>
      xerroService.getLogs({
        level: level === "all" ? undefined : level,
        limit,
      }),
    refetchInterval: isPaused ? false : 3000, // 3 seconds
    refetchIntervalInBackground: false,
    retry: false,
  });

  const logs = xerroLogs?.logs || [];

  const getLevelBadgeVariant = (
    level: string
  ): "default" | "destructive" | "secondary" => {
    switch (level) {
      case "error":
        return "destructive";
      case "warn":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp?: string): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Container
      title="Xerro Logs"
      description="Xerro service logs and events"
      icon={ScrollText}
      tools={
        <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Back</span>
        </ContainerToolButton>
      }
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Level:</label>
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
        >
          {isPaused ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              Resume
            </>
          ) : (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          )}
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          Showing {logs.length} entries
          {!isPaused && " (auto-refresh 3s)"}
        </div>
      </div>

      {/* Logs Display */}
      <div className="border rounded-lg bg-muted/30">
        <div className="max-h-[600px] overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No logs found
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log, index) => (
                <div key={index} className="p-4 hover:bg-accent/50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 min-w-[100px] text-xs text-muted-foreground font-mono">
                      {formatTimestamp(log.time)}
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={getLevelBadgeVariant(log.level || "info")}>
                        {log.level || "info"}
                      </Badge>
                    </div>
                    <div className="flex-1 text-sm break-words">
                      {log.msg || "No message"}
                    </div>
                  </div>
                  {log.service && (
                    <div className="mt-1 ml-[100px] text-xs text-muted-foreground">
                      Service: {log.service}
                    </div>
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
