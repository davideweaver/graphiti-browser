import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { llamacppAdminService } from "@/api/llamacppAdminService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, Pause, Play, ChevronLeft } from "lucide-react";

interface ParsedLogEntry {
  timestamp?: string;
  level: string;
  message: string;
  raw: string;
}

export default function RouterLogs() {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const limit = 100;

  // Poll for router logs
  const { data: routerLogs, isLoading } = useQuery({
    queryKey: ["router-logs", limit],
    queryFn: () => llamacppAdminService.getRouterLogs({ limit }),
    refetchInterval: isPaused ? false : 3000, // 3 seconds
    refetchIntervalInBackground: false,
    retry: false,
  });

  // Try to extract timestamp from log line (common formats)
  const extractTimestamp = (line: string): string | undefined => {
    // ISO 8601 format: 2024-01-01T12:00:00.000Z
    const isoMatch = line.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    if (isoMatch) return isoMatch[0];

    // Date format: 2024-01-01 12:00:00
    const dateMatch = line.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/);
    if (dateMatch) return dateMatch[0];

    // Time format at start: 12:00:00
    const timeMatch = line.match(/^\d{2}:\d{2}:\d{2}/);
    if (timeMatch) return timeMatch[0];

    return undefined;
  };

  // Parse raw stdout/stderr into log entries
  const parseLogs = (stdout?: string, stderr?: string): ParsedLogEntry[] => {
    const entries: ParsedLogEntry[] = [];

    if (stdout) {
      const lines = stdout.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        entries.push({
          timestamp: extractTimestamp(line),
          level: "info",
          message: line,
          raw: line
        });
      });
    }

    if (stderr) {
      const lines = stderr.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        entries.push({
          timestamp: extractTimestamp(line),
          level: "error",
          message: line,
          raw: line
        });
      });
    }

    return entries.reverse(); // Most recent first
  };

  const logs = parseLogs(routerLogs?.stdout, routerLogs?.stderr);

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

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Container
      title="Router Logs"
      description="Llamacpp router logs and events"
      icon={ScrollText}
      tools={
        <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Back</span>
        </ContainerToolButton>
      }
    >
      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-4">
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
                    {log.timestamp && (
                      <div className="flex-shrink-0 min-w-[100px] text-xs text-muted-foreground font-mono">
                        {formatTimestamp(log.timestamp)}
                      </div>
                    )}
                    <div className="flex-shrink-0">
                      <Badge variant={getLevelBadgeVariant(log.level)}>
                        {log.level}
                      </Badge>
                    </div>
                    <div className="flex-1 text-sm break-words font-mono">
                      {log.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
