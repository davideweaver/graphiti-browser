import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { llamacppAdminService } from "@/api/llamacppAdminService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Router as RouterIcon, Play, Square, RefreshCw, FileText } from "lucide-react";
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

export default function LlamacppRouter() {
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"stop" | "restart" | null>(
    null
  );

  // Poll for router status
  const { data: router, isLoading, refetch } = useQuery({
    queryKey: ["llamacpp-router"],
    queryFn: () => llamacppAdminService.getRouterStatus(),
    refetchInterval: 5000, // 5 seconds
    refetchIntervalInBackground: false,
    retry: false,
  });

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await llamacppAdminService.startRouter();
      await refetch();
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await llamacppAdminService.stopRouter();
      await refetch();
    } finally {
      setIsStopping(false);
      setConfirmAction(null);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      await llamacppAdminService.stopRouter();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await llamacppAdminService.startRouter();
      await refetch();
    } finally {
      setIsRestarting(false);
      setConfirmAction(null);
    }
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <Container
        title="Router Status"
        description="LLM request routing and load balancing"
        icon={RouterIcon}
        tools={
          <ContainerToolButton
            size="sm"
            onClick={() => navigate("/system/logs/router")}
          >
            <FileText className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">View Logs</span>
          </ContainerToolButton>
        }
      >
        <div className="space-y-6">
          {/* Status Card */}
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Router Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Router Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      router?.status === "running"
                        ? "bg-green-500"
                        : router?.status === "error"
                          ? "bg-red-500"
                          : "bg-muted"
                    }`}
                  />
                  <Badge
                    variant={
                      router?.status === "running"
                        ? "default"
                        : router?.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {router?.status || "unknown"}
                  </Badge>
                </div>

                {router?.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                    {router.error}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Port:</span>
                    <span className="font-medium">{router?.port || "—"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uptime:</span>
                    <span className="font-medium">
                      {formatUptime(router?.uptime)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Connected Servers:
                    </span>
                    <span className="font-medium">
                      {router?.connectedServers ?? "—"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {router?.status === "running" ? (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmAction("stop")}
                        disabled={isStopping || isRestarting}
                      >
                        {isStopping ? (
                          <>
                            <Square className="mr-2 h-4 w-4" />
                            Stopping...
                          </>
                        ) : (
                          <>
                            <Square className="mr-2 h-4 w-4" />
                            Stop
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConfirmAction("restart")}
                        disabled={isStopping || isRestarting}
                      >
                        {isRestarting ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Restarting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Restart
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleStart}
                      disabled={isStarting}
                    >
                      {isStarting ? (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Start
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate("/system/logs?service=llamacpp&type=router")
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Configuration Card */}
          {router?.config && (
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {router.config.timeout && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Request Timeout:
                      </span>
                      <span className="font-medium">
                        {router.config.timeout}ms
                      </span>
                    </div>
                  )}
                  {router.config.healthCheckInterval && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Health Check Interval:
                      </span>
                      <span className="font-medium">
                        {router.config.healthCheckInterval}ms
                      </span>
                    </div>
                  )}
                  {router.config.retries !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Max Retries:
                      </span>
                      <span className="font-medium">{router.config.retries}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Container>

      {/* Confirmation Dialogs */}
      <AlertDialog
        open={confirmAction === "stop"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Router?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the LLM router. All ongoing requests will be
              interrupted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStop}>Stop</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction === "restart"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Router?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart the LLM router. All ongoing requests will be
              interrupted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart}>
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
