import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { llamacppAdminService } from "@/api/llamacppAdminService";
import Container from "@/components/container/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Server, Play, Square, RefreshCw, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FilterStatus = "all" | "running" | "stopped";

export default function LlamacppServers() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [controllingServer, setControllingServer] = useState<string | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<{
    serverId: string;
    action: "start" | "stop" | "restart";
  } | null>(null);

  // Poll for server list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["llamacpp-servers"],
    queryFn: () => llamacppAdminService.listServers(),
    refetchInterval: 5000, // 5 seconds
    refetchIntervalInBackground: false,
    retry: false,
  });

  const handleControl = async (
    serverId: string,
    action: "start" | "stop" | "restart"
  ) => {
    setControllingServer(serverId);
    try {
      if (action === "start") {
        await llamacppAdminService.startServer(serverId);
      } else if (action === "stop") {
        await llamacppAdminService.stopServer(serverId);
      } else if (action === "restart") {
        await llamacppAdminService.restartServer(serverId);
      }
      await refetch();
    } finally {
      setControllingServer(null);
      setConfirmAction(null);
    }
  };

  const servers = data?.servers || [];

  // Filter servers
  const filteredServers = servers.filter((server) => {
    if (filter === "running") return server.status === "running";
    if (filter === "stopped") return server.status === "stopped";
    return true;
  });


  return (
    <>
      <Container
        title="LLM Servers"
        description="Manage llama.cpp inference servers"
        icon={Server}
      >
        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All ({servers.length})
          </Button>
          <Button
            variant={filter === "running" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("running")}
          >
            Running (
            {servers.filter((s) => s.status === "running").length})
          </Button>
          <Button
            variant={filter === "stopped" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("stopped")}
          >
            Stopped (
            {servers.filter((s) => s.status === "stopped").length})
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Server</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Model</th>
                <th className="text-left py-3 px-4 font-medium">Port</th>
                <th className="text-right py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-8 w-24 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredServers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No servers found
                  </td>
                </tr>
              ) : (
                filteredServers.map((server) => (
                  <tr key={server.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">
                        {server.alias || server.id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          server.status === "running"
                            ? "default"
                            : server.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {server.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {server.modelName || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {server.port}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            navigate(`/system/logs/server/${server.id}`)
                          }
                          title="View Logs"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {server.status === "running" ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setConfirmAction({
                                  serverId: server.id,
                                  action: "restart",
                                })
                              }
                              disabled={controllingServer === server.id}
                            >
                              {controllingServer === server.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                setConfirmAction({
                                  serverId: server.id,
                                  action: "stop",
                                })
                              }
                              disabled={controllingServer === server.id}
                            >
                              <Square className="h-4 w-4" fill="currentColor" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              setConfirmAction({
                                serverId: server.id,
                                action: "start",
                              })
                            }
                            disabled={controllingServer === server.id}
                          >
                            <Play className="h-4 w-4" fill="currentColor" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "start"
                ? "Start Server?"
                : confirmAction?.action === "stop"
                  ? "Stop Server?"
                  : "Restart Server?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "start"
                ? "This will start the server and load the configured model."
                : confirmAction?.action === "stop"
                  ? "This will stop the server. Any ongoing requests will be interrupted."
                  : "This will restart the server. Any ongoing requests will be interrupted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmAction &&
                handleControl(confirmAction.serverId, confirmAction.action)
              }
            >
              {confirmAction?.action === "start"
                ? "Start"
                : confirmAction?.action === "stop"
                  ? "Stop"
                  : "Restart"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
