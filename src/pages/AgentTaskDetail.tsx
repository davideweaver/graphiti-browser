import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import { agentTasksService } from "@/api/agentTasksService";
import {
  formatCronExpression,
  formatTimestamp,
  formatRelativeTime,
} from "@/lib/cronFormatter";
import { CheckCircle2, XCircle, Clock, Play, Trash2 } from "lucide-react";
import { TaskExecutionSheet } from "@/components/tasks/TaskExecutionSheet";
import type { TaskExecution } from "@/types/agentTasks";

export default function AgentTaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedExecution, setSelectedExecution] =
    useState<TaskExecution | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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

  // Mutation to trigger task execution
  const triggerMutation = useMutation({
    mutationFn: () => agentTasksService.triggerTask(id!),
    onSuccess: (execution) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["agent-task-history", id] });
      queryClient.invalidateQueries({
        queryKey: ["agent-task-scratchpad", id],
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
          <ContainerToolButton
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending || !task.enabled}
            size="sm"
            variant="primary"
          >
            <Play className="h-4 w-4 mr-2" />
            {triggerMutation.isPending ? "Running..." : "Run Task"}
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="history">
              History {history ? `(${history.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="config">
              Config
            </TabsTrigger>
            <TabsTrigger value="scratchpad">
              Scratchpad
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
                      {execution.message && (
                        <p className="text-sm text-muted-foreground pl-6 truncate max-w-2xl">
                          {execution.message}
                        </p>
                      )}
                      {execution.error && (
                        <p className="text-sm text-red-600 dark:text-red-400 pl-6 truncate max-w-2xl">
                          {execution.error}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">{execution.durationMs}ms</span>
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
          </TabsContent>

          {/* Scratchpad Tab */}
          <TabsContent value="scratchpad" className="mt-6">
            {isLoadingScratchpad ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : scratchpad && !scratchpad.isEmpty && scratchpad.content ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-mono mb-2">
                  {scratchpad.path}
                </p>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(scratchpad.content, null, 2)}
                </pre>
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
    </Container>
  );
}
