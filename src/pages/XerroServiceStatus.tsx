import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { xerroService } from "@/api/xerroService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, RefreshCw, FileText } from "lucide-react";
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
import { useState } from "react";

export default function XerroServiceStatus() {
  const navigate = useNavigate();
  const [restartingService, setRestartingService] = useState<string | null>(
    null
  );
  const [confirmRestart, setConfirmRestart] = useState<string | null>(null);

  // Poll for service list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["xerro-services"],
    queryFn: () => xerroService.listServices(),
    refetchInterval: 5000, // 5 seconds
    refetchIntervalInBackground: false,
    retry: false,
  });

  const handleRestart = async (serviceName: string) => {
    setRestartingService(serviceName);
    try {
      await xerroService.restartService(serviceName);
      await refetch();
    } finally {
      setRestartingService(null);
      setConfirmRestart(null);
    }
  };

  const services = data?.services || [];

  return (
    <>
      <Container
        title="Xerro Service Status"
        description="Local system services monitoring"
        icon={Activity}
        tools={
          <ContainerToolButton
            size="sm"
            onClick={() => navigate("/system/logs/xerro")}
          >
            <FileText className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">View Logs</span>
          </ContainerToolButton>
        }
      >
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium">Service</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
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
                    <td className="py-3 px-4 text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-muted-foreground">
                    No services found
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.name} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{service.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={service.running ? "default" : "secondary"}
                      >
                        {service.running ? "Running" : "Stopped"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestart(service.name)}
                        disabled={restartingService === service.name}
                      >
                        {restartingService === service.name ? (
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>

      {/* Restart Confirmation Dialog */}
      <AlertDialog
        open={!!confirmRestart}
        onOpenChange={(open) => !open && setConfirmRestart(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart the service. Any ongoing operations may be
              interrupted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRestart && handleRestart(confirmRestart)}
            >
              Restart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
