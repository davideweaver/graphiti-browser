import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { xerroService } from "@/api/xerroService";
import { llamacppAdminService } from "@/api/llamacppAdminService";
import Container from "@/components/container/Container";
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
import { ScrollText, Pause, Play } from "lucide-react";

export default function SystemLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPaused, setIsPaused] = useState(false);

  const service = searchParams.get("service") || "all";
  const level = searchParams.get("level") || "all";
  const limit = Number(searchParams.get("limit")) || 100;

  // Poll for xerro logs
  const { data: xerroLogs, isLoading: isLoadingXerro } = useQuery({
    queryKey: ["xerro-logs", level === "all" ? undefined : level, limit],
    queryFn: () =>
      xerroService.getLogs({
        level: level === "all" ? undefined : (level as any),
        limit,
      }),
    refetchInterval: isPaused ? false : 3000, // 3 seconds
    refetchIntervalInBackground: false,
    enabled: service === "all" || service === "xerro",
    retry: false,
  });

  // Poll for llamacpp logs (combined from all servers/router)
  const { data: llamacppLogs, isLoading: isLoadingLlamacpp } = useQuery({
    queryKey: ["llamacpp-logs", level === "all" ? undefined : level, limit],
    queryFn: async () => {
      // For now, just get router logs
      // In a real implementation, you'd combine server logs too
      return llamacppAdminService.getRouterLogs({
        level: level === "all" ? undefined : (level as any),
        limit,
      });
    },
    refetchInterval: isPaused ? false : 3000, // 3 seconds
    refetchIntervalInBackground: false,
    enabled: service === "all" || service === "llamacpp",
    retry: false,
  });

  // Combine and sort logs
  const combinedLogs =
    service === "all"
      ? [
          ...(xerroLogs?.logs || []).map((log) => ({ ...log, source: "xerro" })),
          ...(llamacppLogs?.logs || []).map((log) => ({
            ...log,
            source: "llamacpp",
          })),
        ].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      : service === "xerro"
        ? (xerroLogs?.logs || []).map((log) => ({ ...log, source: "xerro" }))
        : (llamacppLogs?.logs || []).map((log) => ({
            ...log,
            source: "llamacpp",
          }));

  const isLoading =
    service === "all"
      ? isLoadingXerro || isLoadingLlamacpp
      : service === "xerro"
        ? isLoadingXerro
        : isLoadingLlamacpp;

  const handleServiceChange = (value: string) => {
    searchParams.set("service", value);
    setSearchParams(searchParams);
  };

  const handleLevelChange = (value: string) => {
    if (value === "all") {
      searchParams.delete("level");
    } else {
      searchParams.set("level", value);
    }
    setSearchParams(searchParams);
  };

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
      title="System Logs"
      description="Service logs and events"
      icon={ScrollText}
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Service:</label>
          <Select value={service} onValueChange={handleServiceChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="xerro">Xerro Service</SelectItem>
              <SelectItem value="llamacpp">Llamacpp Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Level:</label>
          <Select value={level} onValueChange={handleLevelChange}>
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
          Showing {combinedLogs.length} entries
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
          ) : combinedLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No logs found
            </div>
          ) : (
            <div className="divide-y">
              {combinedLogs.map((log, index) => (
                <div key={index} className="p-4 hover:bg-accent/50">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 min-w-[100px] text-xs text-muted-foreground font-mono">
                      {formatTimestamp(log.timestamp)}
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant={getLevelBadgeVariant(log.level)}>
                        {log.level}
                      </Badge>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="outline">{log.source || "system"}</Badge>
                    </div>
                    <div className="flex-1 text-sm break-words">
                      {log.message}
                    </div>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 ml-[100px] text-xs text-muted-foreground font-mono">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
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
