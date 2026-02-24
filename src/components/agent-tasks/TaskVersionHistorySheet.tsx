import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidePanelHeader } from "@/components/shared/SidePanelHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DestructiveConfirmationDialog from "@/components/dialogs/DestructiveConfirmationDialog";
import { agentTasksService } from "@/api/agentTasksService";
import { formatTimestamp, formatRelativeTime } from "@/lib/cronFormatter";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import type { TaskVersionSnapshot } from "@/types/agentTasks";

interface TaskVersionHistorySheetProps {
  taskId: string | null;
  currentVersion?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VersionRow({
  snapshot,
  isCurrent,
  onRestore,
}: {
  snapshot: TaskVersionSnapshot;
  isCurrent: boolean;
  onRestore: (version: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { config } = snapshot;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="font-mono text-xs flex-shrink-0">
                  v{snapshot.version}
                </Badge>
                <span className="text-sm font-medium truncate">{config.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatTimestamp(snapshot.savedAt)} &middot;{" "}
                {formatRelativeTime(snapshot.savedAt)}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isCurrent ? (
              <Badge variant="secondary" className="text-xs">Current</Badge>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRestore(snapshot.version)}
              >
                Restore
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pl-7 space-y-3 border-t pt-3">
            <FieldRow label="Name" value={config.name} mono={false} />
            {config.description && (
              <FieldRow label="Description" value={config.description} mono={false} />
            )}
            {config.schedule && (
              <FieldRow label="Schedule" value={config.schedule} mono />
            )}
            {config.runAt && (
              <FieldRow label="Run At" value={config.runAt} mono />
            )}
            <FieldRow label="Task Type" value={config.task} mono />
            <FieldRow
              label="Enabled"
              value={config.enabled ? "Yes" : "No"}
              mono={false}
            />
            {Object.keys(config.properties ?? {}).length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Properties</p>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {JSON.stringify(config.properties, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FieldRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

export function TaskVersionHistorySheet({
  taskId,
  currentVersion,
  open,
  onOpenChange,
}: TaskVersionHistorySheetProps) {
  const queryClient = useQueryClient();
  const [confirmVersion, setConfirmVersion] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["agent-task-versions", taskId],
    queryFn: () => agentTasksService.getTaskVersions(taskId!),
    enabled: !!taskId && open,
  });

  const restoreMutation = useMutation({
    mutationFn: ({ version }: { version: number }) =>
      agentTasksService.restoreTaskVersion(taskId!, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks-nav"] });
      queryClient.invalidateQueries({ queryKey: ["agent-task-versions", taskId] });
      setConfirmVersion(null);
      onOpenChange(false);
    },
  });

  const versions = data?.versions ?? [];

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-2xl">
          <SidePanelHeader
            title="Version History"
            description="Config snapshots saved on each update"
            headerClassName="-mt-0 pt-1"
          />

          <div className="mt-6 space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <p>Restoring a version creates a new version and never deletes history.</p>
            </div>

            {/* Version list */}
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : versions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No version history yet. Versions are saved each time the task is updated.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {versions.map((snapshot: TaskVersionSnapshot) => (
                  <VersionRow
                    key={snapshot.version}
                    snapshot={snapshot}
                    isCurrent={snapshot.version === currentVersion}
                    onRestore={(version) => setConfirmVersion(version)}
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DestructiveConfirmationDialog
        open={confirmVersion !== null}
        onOpenChange={(open) => { if (!open) setConfirmVersion(null); }}
        onConfirm={() => {
          if (confirmVersion !== null) {
            restoreMutation.mutate({ version: confirmVersion });
          }
        }}
        onCancel={() => setConfirmVersion(null)}
        title="Restore Version"
        description={`The task will be updated to v${confirmVersion}. This creates a new version — no history is deleted.`}
        isLoading={restoreMutation.isPending}
        confirmText="Restore"
        confirmLoadingText="Restoring..."
        confirmVariant="default"
      />
    </>
  );
}
