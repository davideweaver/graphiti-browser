import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { llamacppAdminService } from "@/api/llamacppAdminService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollText, Pause, Play, ChevronLeft } from "lucide-react";

interface ParsedLogEntry {
  timestamp?: string;
  level: string;
  message: string;
  raw: string;
  statusCode?: number;
}

type LogType = "stdout" | "stderr";

export default function ServerLogs() {
  const navigate = useNavigate();
  const { serverId } = useParams<{ serverId: string }>();
  const [isPaused, setIsPaused] = useState(false);
  const [logType, setLogType] = useState<LogType>("stdout");
  const limit = 100;

  // Poll for server logs
  const { data: serverLogs, isLoading } = useQuery({
    queryKey: ["server-logs", serverId, limit],
    queryFn: () => llamacppAdminService.getServerLogs(serverId!, { limit }),
    refetchInterval: isPaused ? false : 3000, // 3 seconds
    refetchIntervalInBackground: false,
    retry: false,
    enabled: !!serverId,
  });

  // Strip ANSI color codes from log lines
  const stripAnsiCodes = (text: string): string => {
    // eslint-disable-next-line no-control-regex
    return text.replace(/\x1b\[[0-9;]*m/g, '');
  };

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
  const parseLogs = (
    stdout?: string,
    stderr?: string,
    type?: LogType
  ): ParsedLogEntry[] => {
    const entries: ParsedLogEntry[] = [];

    if (type === "stdout" && stdout) {
      const lines = stdout.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const cleanedLine = stripAnsiCodes(line);
        entries.push({
          timestamp: extractTimestamp(cleanedLine),
          level: "info",
          message: cleanedLine,
          raw: line,
        });
      });
    }

    if (type === "stderr" && stderr) {
      const lines = stderr.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const cleanedLine = stripAnsiCodes(line);
        entries.push({
          timestamp: extractTimestamp(cleanedLine),
          level: "error",
          message: cleanedLine,
          raw: line
        });
      });
    }

    return entries.reverse(); // Most recent first
  };

  const logs = parseLogs(serverLogs?.stdout, serverLogs?.stderr, logType);

  const getLogLevelColorClass = (level: string): string => {
    switch (level) {
      case "error":
        return "text-red-600 dark:text-red-400";
      case "warn":
        return "text-yellow-600 dark:text-yellow-400";
      default:
        return "";
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <Container
      title={`Server Logs: ${serverId}`}
      description="Llamacpp server logs and events"
      icon={ScrollText}
      content="fixedWithScroll"
      tools={
        <>
          <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </ContainerToolButton>
          <ContainerToolButton
            size="sm"
            variant="outline"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="h-4 w-4" />
            ) : (
              <Pause className="h-4 w-4" />
            )}
          </ContainerToolButton>
        </>
      }
    >
      <div className="flex flex-col h-full">
        {/* Log Type Tabs */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <Tabs value={logType} onValueChange={(value) => setLogType(value as LogType)}>
            <TabsList>
              <TabsTrigger value="stdout">Activity</TabsTrigger>
              <TabsTrigger value="stderr">System</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="text-sm text-muted-foreground">
            Showing {logs.length} entries
            {!isPaused && " (auto-refresh 3s)"}
          </div>
        </div>

        {/* Logs Display */}
        <div className="border rounded-lg bg-muted/30 flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-auto">
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
                  <div key={index} className="py-2 px-4 hover:bg-accent/50">
                    <div className="flex items-start gap-3">
                      {log.timestamp && (
                        <div className="flex-shrink-0 min-w-[100px] text-xs text-muted-foreground font-mono">
                          {formatTimestamp(log.timestamp)}
                        </div>
                      )}
                      <div
                        className={`flex-1 text-sm break-words font-mono ${getLogLevelColorClass(log.level)}`}
                      >
                        {log.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
