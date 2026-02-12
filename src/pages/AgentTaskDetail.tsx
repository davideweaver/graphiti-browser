import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import { agentTasksService } from "@/api/agentTasksService";
import {
  formatCronExpression,
  formatTimestamp,
  formatRelativeTime,
  formatDuration,
} from "@/lib/cronFormatter";
import { CheckCircle2, XCircle, Clock, Play, Trash2, Copy, ChevronDown } from "lucide-react";
import { TaskExecutionSheet } from "@/components/tasks/TaskExecutionSheet";
import { RunAgentConfigForm } from "@/components/agent-tasks/RunAgentConfigForm";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { TaskExecution } from "@/types/agentTasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AgentTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedExecution, setSelectedExecution] =
    useState<TaskExecution | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearScratchpadDialogOpen, setClearScratchpadDialogOpen] = useState(false);

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

  // Mutation to trigger task execution
  const triggerMutation = useMutation({
    mutationFn: ({ withTrace }: { withTrace: boolean }) => agentTasksService.triggerTask(id!, withTrace),
    onSuccess: (execution) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["agent-task-history", id] });
      queryClient.invalidateQueries({
        queryKey: ["agent-task-scratchpad", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["agent-task-trace", id],
      });

      // Show the execution result in the sheet
      setSelectedExecution(execution);
      setSheetOpen(true);
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
      queryClient.invalidateQueries({ queryKey: ["agent-task-scratchpad", id] });
    },
  });

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

  const renderExecutionStatus = (execution: TaskExecution) => {
    if (execution.success) {
      return (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Success</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
        <XCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Failed</span>
      </div>
    );
  };

  return (
    <Container
      title={task.name}
      tools={
        <div className="flex items-center gap-2">
          {/* Combo Button for Run */}
          <div className="flex items-center">
            <ContainerToolButton
              onClick={() => triggerMutation.mutate({ withTrace: false })}
              disabled={triggerMutation.isPending || !task.enabled}
              size="sm"
              variant="primary"
              className="rounded-r-none border-r-0"
            >
              <Play className="h-4 w-4 mr-2" />
              {triggerMutation.isPending ? "Running..." : "Run"}
            </ContainerToolButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <ContainerToolButton
                  disabled={triggerMutation.isPending || !task.enabled}
                  size="sm"
                  variant="primary"
                  className="rounded-l-none px-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </ContainerToolButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => triggerMutation.mutate({ withTrace: true })}>
                  Run with Tracing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                      navigator.clipboard.writeText(task.id).then(() => {
                        toast.success("Task ID copied to clipboard");
                      }).catch(() => {
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
        <Tabs defaultValue="history">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="history">
              History {history ? `(${history.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="config">
              Config
            </TabsTrigger>
            <TabsTrigger value="scratchpad">
              Scratchpad
            </TabsTrigger>
            <TabsTrigger value="trace">
              Last Trace
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
              <div className="space-y-2">
                {history.map((execution, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/30 -mx-2 px-2 py-2 rounded-md transition-colors"
                    onClick={() => {
                      setSelectedExecution(execution);
                      setSheetOpen(true);
                    }}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-3">
                        {renderExecutionStatus(execution)}
                        <span className="text-sm text-muted-foreground">
                          {formatTimestamp(execution.timestamp)}
                        </span>
                      </div>
                      {(execution.normalizedResult?.display.summary || execution.message) && (
                        <div className="text-sm text-muted-foreground pl-6 truncate max-w-2xl prose prose-sm dark:prose-invert prose-p:inline prose-strong:font-semibold">
                          <ReactMarkdown>{execution.normalizedResult?.display.summary || execution.message}</ReactMarkdown>
                        </div>
                      )}
                      {execution.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 pl-6 truncate max-w-2xl">
                          {execution.error}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">{formatDuration(execution.durationMs)}</span>
                    </div>
                  </div>
                ))}
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
                  queryClient.invalidateQueries({ queryKey: ["agent-task", id] });
                  queryClient.invalidateQueries({ queryKey: ["agent-tasks"] });
                }}
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-end pb-3">
                  <ContainerToolButton
                    onClick={() => setClearScratchpadDialogOpen(true)}
                    disabled={clearScratchpadMutation.isPending}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </ContainerToolButton>
                </CardHeader>
                <CardContent className="pt-0">
                  <pre className="text-xs overflow-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(scratchpad.content, null, 2)}
                  </pre>
                </CardContent>
              </Card>
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
                          <span className="text-muted-foreground">Executed At:</span>
                          <p>{formatTimestamp(trace.trace.toolCalls[0].calledAt)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(trace.trace.toolCalls[0].calledAt)}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Execution ID:</span>
                        <p className="font-mono">{trace.trace.executionId}</p>
                      </div>
                      {trace.trace.sessionId && (
                        <div>
                          <span className="text-muted-foreground">Session ID:</span>
                          <p className="font-mono">{trace.trace.sessionId}</p>
                        </div>
                      )}
                      {trace.trace.cwd && (
                        <div>
                          <span className="text-muted-foreground">Working Dir:</span>
                          <p className="font-mono">{trace.trace.cwd}</p>
                        </div>
                      )}
                      {trace.trace.permissionMode && (
                        <div>
                          <span className="text-muted-foreground">Permissions:</span>
                          <p className="font-mono">{trace.trace.permissionMode}</p>
                        </div>
                      )}
                      {trace.trace.totalCostUsd !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <p className="font-mono">${trace.trace.totalCostUsd.toFixed(4)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tool Calls Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tool Calls ({trace.trace.toolCalls.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trace.trace.toolCalls.map((call, idx) => {
                      const result = trace.trace!.toolResults.find(r => r.toolUseId === call.id);
                      return (
                        <div key={call.id} className="border-l-2 border-muted pl-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">{call.name}</Badge>
                              {result && (
                                result.isError ? (
                                  <XCircle className="h-3 w-3 text-red-500" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                )
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(call.calledAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Input:</p>
                            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                              {JSON.stringify(call.input, null, 2)}
                            </pre>
                          </div>
                          {result && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">Output:</p>
                                {result.truncated && (
                                  <Badge variant="secondary" className="text-xs">
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
                      <CardTitle className="text-sm">Permission Decisions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {trace.trace.permissions.map((perm, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs border-b pb-2 last:border-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={perm.decision === 'allow' ? 'default' : 'destructive'}>
                                {perm.decision}
                              </Badge>
                              <span className="font-mono">{perm.toolName}</span>
                            </div>
                            {perm.reason && (
                              <span className="text-muted-foreground">{perm.reason}</span>
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
                    No trace data available. Run the task with "Run with Tracing" to collect trace data.
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
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={() => {
          deleteMutation.mutate();
          setDeleteDialogOpen(false);
        }}
        onCancel={() => setDeleteDialogOpen(false)}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.name}"? This action cannot be undone. All task configuration, execution history, and scratchpad data will be permanently deleted.`}
      />

      {/* Clear Scratchpad Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={clearScratchpadDialogOpen}
        onOpenChange={setClearScratchpadDialogOpen}
        onDelete={() => {
          clearScratchpadMutation.mutate();
          setClearScratchpadDialogOpen(false);
        }}
        onCancel={() => setClearScratchpadDialogOpen(false)}
        title="Clear Scratchpad"
        description="Are you sure you want to clear the scratchpad? This action cannot be undone and all scratchpad data will be permanently deleted."
      />
    </Container>
  );
}
