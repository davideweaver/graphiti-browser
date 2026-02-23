import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { ContainerToolToggle } from "@/components/container/ContainerToolToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DestructiveConfirmationDialog from "@/components/dialogs/DestructiveConfirmationDialog";
import { agentTasksService } from "@/api/agentTasksService";
import {
  formatCronExpression,
  formatTimestamp,
  formatRelativeTime,
} from "@/lib/cronFormatter";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Trash2,
  Copy,
  Power,
  Loader2,
} from "lucide-react";
import { TaskExecutionSheet } from "@/components/tasks/TaskExecutionSheet";
import { TaskExecutionRow } from "@/components/tasks/TaskExecutionRow";
import { RunAgentConfigForm } from "@/components/agent-tasks/RunAgentConfigForm";
import { useTaskConfigUpdates } from "@/hooks/use-task-config-updates";
import { useAgentCompletionUpdates } from "@/hooks/use-agent-completion-updates";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import type { TaskExecution } from "@/types/agentTasks";

export default function AgentTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedExecution, setSelectedExecution] =
    useState<TaskExecution | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [clearScratchpadDialogOpen, setClearScratchpadDialogOpen] =
    useState(false);
  const [clearHistoryDialogOpen, setClearHistoryDialogOpen] = useState(false);
  const [deleteExecutionDialogOpen, setDeleteExecutionDialogOpen] =
    useState(false);
  const [executionToDelete, setExecutionToDelete] = useState<string | null>(
    null,
  );
  const [isDelayingRedirect, setIsDelayingRedirect] = useState(false);

  // Listen for real-time task configuration updates
  useTaskConfigUpdates();

  // Listen for agent completion events to refresh history, scratchpad, and traces
  useAgentCompletionUpdates();

  const { data: task, isLoading: isLoadingTask } = useQuery({
    queryKey: ["agent-task", id],
    queryFn: () => agentTasksService.getTask(id!),
    enabled: !!id,
  });

  const { data: history, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["agent-task-history", id],
    queryFn: () => agentTasksService.getTaskHistory(id!, 20),
    enabled: !!id,
  });

  const { data: scratchpad, isLoading: isLoadingScratchpad } = useQuery({
    queryKey: ["agent-task-scratchpad", id],
    queryFn: () => agentTasksService.getScratchpad(id!),
    enabled: !!id,
  });

  const { data: trace, isLoading: isLoadingTrace } = useQuery({
    queryKey: ["agent-task-trace", id],
    queryFn: () => agentTasksService.getTrace(id!),
    enabled: !!id,
  });

  // Mutation to trigger task execution (tracing is always enabled)
  const triggerMutation = useMutation({
    mutationFn: () => agentTasksService.triggerTask(id!, true),
    onSuccess: () => {
      // Invalidate queries in the background to refresh data
      queryClient.invalidateQueries({ queryKey: ["agent-task-history", id] });
      queryClient.invalidateQueries({
        queryKey: ["agent-task-scratchpad", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-task-trace", id],
      });
    },
    onError: (error) => {
      console.error("Failed to trigger task:", error);
      toast.error("Failed to trigger task");
    },
  });

  // Mutation to delete task
  const deleteMutation = useMutation({
    mutationFn: () => agentTasksService.deleteTask(id!),
    onSuccess: () => {
      // Invalidate task lists to refresh navigation
      queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks-nav"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks-redirect"] });

      // Navigate back to the task list (will redirect to first task)
      navigate("/agent-tasks", { replace: true });
    },
  });

  // Mutation to clear scratchpad
  const clearScratchpadMutation = useMutation({
    mutationFn: () => agentTasksService.clearScratchpad(id!),
    onSuccess: () => {
      // Invalidate scratchpad query to refresh data
      queryClient.invalidateQueries({
        queryKey: ["agent-task-scratchpad", id],
      });
    },
  });

  // Mutation to clear task history
  const clearHistoryMutation = useMutation({
    mutationFn: () => agentTasksService.clearTaskHistory(id!),
    onSuccess: () => {
      // Invalidate history query to refresh data
      queryClient.invalidateQueries({ queryKey: ["agent-task-history", id] });
      setClearHistoryDialogOpen(false);
    },
  });

  // Mutation to delete individual execution
  const deleteExecutionMutation = useMutation({
    mutationFn: (executionId: string) =>
      agentTasksService.deleteExecution(executionId),
    onSuccess: () => {
      // Invalidate history query to refresh data
      queryClient.invalidateQueries({ queryKey: ["agent-task-history", id] });
      setDeleteExecutionDialogOpen(false);
      setExecutionToDelete(null);
    },
  });

  // Mutation to duplicate task
  const duplicateMutation = useMutation({
    mutationFn: () =>
      agentTasksService.createTask({
        name: `${task!.name} (Copy)`,
        task: task!.task,
        ...(task!.schedule && { schedule: task!.schedule }),
        ...(task!.runAt && { runAt: task!.runAt }),
        ...(task!.description && { description: task!.description }),
        enabled: false,
        properties: task!.properties,
      }),
    onSuccess: (newTask) => {
      setDuplicateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks-nav"] });
      toast.success("Task duplicated");
      navigate(`/agent-tasks/${newTask.id}`);
    },
  });

  // Mutation to toggle enabled status
  const toggleEnabledMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      agentTasksService.updateTask(id!, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-task", id] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["agent-tasks-nav"] });
    },
  });

  // Helper function to trigger task and navigate after delay
  const handleRunTask = () => {
    setIsDelayingRedirect(true);
    triggerMutation.mutate();

    // Wait 3 seconds before navigating
    setTimeout(() => {
      setIsDelayingRedirect(false);
      navigate("/agent-tasks/activity");
    }, 3000);
  };

  if (isLoadingTask) {
    return (
      <Container title="Loading...">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Container>
    );
  }

  if (!task) {
    return (
      <Container title="Task Not Found">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">
            The requested task could not be found.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={task.name}
      tools={
        <div className="flex items-center gap-2">
          <ContainerToolButton
            onClick={handleRunTask}
            disabled={
              triggerMutation.isPending || isDelayingRedirect || !task.enabled
            }
            size="sm"
            variant="primary"
          >
            {triggerMutation.isPending || isDelayingRedirect ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {triggerMutation.isPending || isDelayingRedirect
              ? "Running..."
              : "Run"}
          </ContainerToolButton>
          <ContainerToolToggle
            pressed={task.enabled}
            onPressedChange={(val) => toggleEnabledMutation.mutate(val)}
            disabled={toggleEnabledMutation.isPending}
            aria-label={task.enabled ? "Disable Task" : "Enable Task"}
            className="data-[state=on]:bg-green-600 data-[state=on]:hover:bg-green-700"
          >
            <Power strokeWidth={task.enabled ? 3.5 : 1.5} className={task.enabled ? undefined : "opacity-40"} />
          </ContainerToolToggle>
          <ContainerToolButton
            onClick={() => setDuplicateDialogOpen(true)}
            disabled={duplicateMutation.isPending}
            size="icon"
            variant="default"
            title="Duplicate Task"
          >
            <Copy className="h-4 w-4" />
          </ContainerToolButton>
          <ContainerToolButton
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteMutation.isPending}
            size="icon"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
          </ContainerToolButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Task Details</CardTitle>
              <Badge variant={task.enabled ? "default" : "secondary"}>
                {task.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {task.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Description
                </h3>
                <p className="text-sm">{task.description}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Schedule
                </h3>
                <p className="text-sm">
                  {task.schedule
                    ? formatCronExpression(task.schedule)
                    : task.runAt
                      ? `One-time: ${formatTimestamp(task.runAt)}`
                      : "Not scheduled"}
                </p>
                {task.schedule && (
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {task.schedule}
                  </p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Task Type
                </h3>
                <p className="text-sm font-mono">{task.task}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Task ID
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono break-all">{task.id}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(task.id)
                        .then(() => {
                          toast.success("Task ID copied to clipboard");
                        })
                        .catch(() => {
                          toast.error("Failed to copy Task ID");
                        });
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Created
                </h3>
                <p className="text-sm">{formatTimestamp(task.createdAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(task.createdAt)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Last Updated
                </h3>
                <p className="text-sm">{formatTimestamp(task.updatedAt)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(task.updatedAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="config">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="config">
              {isMobile ? "Config" : "Config"}
            </TabsTrigger>
            <TabsTrigger value="history">
              {isMobile ? "Runs" : "History"}{" "}
              {history ? `(${history.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="scratchpad">
              {isMobile ? "Scratch" : "Scratchpad"}
            </TabsTrigger>
            <TabsTrigger value="trace">
              {isMobile ? "Trace" : "Last Trace"}
            </TabsTrigger>
          </TabsList>

          {/* Execution History Tab */}
          <TabsContent value="history" className="mt-6">
            {isLoadingHistory ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : history && history.length > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {history.map((execution, index) => (
                    <TaskExecutionRow
                      key={index}
                      execution={execution}
                      onClick={() => {
                        setSelectedExecution(execution);
                        setSheetOpen(true);
                      }}
                      onDelete={(executionId) => {
                        setExecutionToDelete(executionId);
                        setDeleteExecutionDialogOpen(true);
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setClearHistoryDialogOpen(true)}
                    disabled={clearHistoryMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear History
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No execution history available
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="mt-6">
            {task.task === "run-agent" ? (
              <RunAgentConfigForm
                task={task}
                onSaved={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["agent-task", id],
                  });
                  queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
                }}
                buttonPosition="bottom"
              />
            ) : (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Properties
                </h3>
                {Object.keys(task.properties).length > 0 ? (
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(task.properties, null, 2)}
                  </pre>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-sm text-muted-foreground">
                        No properties configured
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Scratchpad Tab */}
          <TabsContent value="scratchpad" className="mt-6">
            {isLoadingScratchpad ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : scratchpad && !scratchpad.isEmpty && scratchpad.content ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(scratchpad.content, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setClearScratchpadDialogOpen(true)}
                    disabled={clearScratchpadMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Scratchpad
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No scratchpad data
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trace Tab */}
          <TabsContent value="trace" className="mt-6">
            {isLoadingTrace ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : trace && !trace.isEmpty && trace.trace ? (
              <div className="space-y-4">
                {/* Execution Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Execution Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      {trace.trace.toolCalls.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">
                            Executed At:
                          </span>
                          <p>
                            {formatTimestamp(trace.trace.toolCalls[0].calledAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(
                              trace.trace.toolCalls[0].calledAt,
                            )}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Execution ID:
                        </span>
                        <p className="font-mono">{trace.trace.executionId}</p>
                      </div>
                      {trace.trace.sessionId && (
                        <div>
                          <span className="text-muted-foreground">
                            Session ID:
                          </span>
                          <p className="font-mono">{trace.trace.sessionId}</p>
                        </div>
                      )}
                      {trace.trace.cwd && (
                        <div>
                          <span className="text-muted-foreground">
                            Working Dir:
                          </span>
                          <p className="font-mono">{trace.trace.cwd}</p>
                        </div>
                      )}
                      {trace.trace.permissionMode && (
                        <div>
                          <span className="text-muted-foreground">
                            Permissions:
                          </span>
                          <p className="font-mono">
                            {trace.trace.permissionMode}
                          </p>
                        </div>
                      )}
                      {trace.trace.totalCostUsd !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <p className="font-mono">
                            ${trace.trace.totalCostUsd.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tool Calls Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Tool Calls ({trace.trace.toolCalls.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trace.trace.toolCalls.map((call, idx) => {
                      const result = trace.trace!.toolResults.find(
                        (r) => r.toolUseId === call.id,
                      );
                      return (
                        <div
                          key={call.id}
                          className="border-l-2 border-muted pl-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {call.name}
                              </Badge>
                              {result &&
                                (result.isError ? (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(call.calledAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Input:
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(call.input, null, 2)}
                            </pre>
                          </div>
                          {result && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">
                                  Output:
                                </p>
                                {result.truncated && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Truncated ({result.originalSizeBytes} bytes)
                                  </Badge>
                                )}
                              </div>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap break-words">
                                {result.content}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Permission Decisions */}
                {trace.trace.permissions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Permission Decisions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trace.trace.permissions.map((perm, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs border-b pb-2 last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  perm.decision === "allow"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {perm.decision}
                              </Badge>
                              <span className="font-mono">{perm.toolName}</span>
                            </div>
                            {perm.reason && (
                              <span className="text-muted-foreground">
                                {perm.reason}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No trace data available. Trace data is collected
                    automatically on each run.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Execution Detail Sheet */}
      <TaskExecutionSheet
        execution={selectedExecution}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Delete Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          deleteMutation.mutate();
          setDeleteDialogOpen(false);
        }}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.name}"? This action cannot be undone. All task configuration, execution history, and scratchpad data will be permanently deleted.`}
      />

      {/* Duplicate Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        onConfirm={() => duplicateMutation.mutate()}
        onCancel={() => setDuplicateDialogOpen(false)}
        title="Duplicate Task"
        description={`Create a copy of "${task.name}"? The duplicate will be disabled by default.`}
        isLoading={duplicateMutation.isPending}
        confirmText="Duplicate"
        confirmLoadingText="Duplicating..."
        confirmVariant="default"
      />

      {/* Clear Scratchpad Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={clearScratchpadDialogOpen}
        onOpenChange={setClearScratchpadDialogOpen}
        onConfirm={() => {
          clearScratchpadMutation.mutate();
          setClearScratchpadDialogOpen(false);
        }}
        onCancel={() => setClearScratchpadDialogOpen(false)}
        title="Clear Scratchpad"
        description="Are you sure you want to clear the scratchpad? This action cannot be undone and all scratchpad data will be permanently deleted."
      />

      {/* Clear History Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={clearHistoryDialogOpen}
        onOpenChange={setClearHistoryDialogOpen}
        onConfirm={() => clearHistoryMutation.mutate()}
        onCancel={() => setClearHistoryDialogOpen(false)}
        title="Clear Task History"
        description={`Are you sure you want to clear all execution history for "${task?.name}"? This action cannot be undone and all execution records will be permanently deleted.`}
        isLoading={clearHistoryMutation.isPending}
        confirmText="Clear History"
        confirmLoadingText="Clearing..."
        confirmVariant="destructive"
      />

      {/* Delete Execution Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={deleteExecutionDialogOpen}
        onOpenChange={setDeleteExecutionDialogOpen}
        onConfirm={() => {
          if (executionToDelete) {
            deleteExecutionMutation.mutate(executionToDelete);
          }
        }}
        onCancel={() => {
          setDeleteExecutionDialogOpen(false);
          setExecutionToDelete(null);
        }}
        title="Delete Execution"
        description="Are you sure you want to delete this execution from history? This action cannot be undone."
        isLoading={deleteExecutionMutation.isPending}
        confirmText="Delete"
        confirmLoadingText="Deleting..."
        confirmVariant="destructive"
      />
    </Container>
  );
}
