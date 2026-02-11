import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Container from "@/components/container/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { agentTasksService } from "@/api/agentTasksService";
import { formatTimestamp, formatDuration } from "@/lib/cronFormatter";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { TaskExecutionSheet } from "@/components/tasks/TaskExecutionSheet";
import type { TaskExecution } from "@/types/agentTasks";

export default function AgentTaskHistory() {
  const navigate = useNavigate();
  const [selectedExecution, setSelectedExecution] =
    useState<TaskExecution | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: recentRuns, isLoading } = useQuery({
    queryKey: ["agent-task-history"],
    queryFn: () => agentTasksService.getRecentRuns(50),
  });

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

  if (isLoading) {
    return (
      <Container title="Task History" description="Loading task execution history...">
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container
      title="Task History"
      description="Recent task executions across all agent tasks"
    >
      <div className="space-y-2">
        {recentRuns && recentRuns.length > 0 ? (
          recentRuns.map((execution, index) => (
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
                  <button
                    className="text-sm font-medium hover:underline text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/agent-tasks/${execution.taskId}`);
                    }}
                  >
                    {execution.taskName}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(execution.timestamp)}
                  </span>
                </div>
                {(execution.normalizedResult?.display.summary || execution.message) && (
                  <p className="text-sm text-muted-foreground pl-6 truncate max-w-2xl">
                    {execution.normalizedResult?.display.summary || execution.message}
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
                <span className="text-xs">{formatDuration(execution.durationMs)}</span>
              </div>
            </div>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No recent task executions found
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Execution Detail Sheet */}
      <TaskExecutionSheet
        execution={selectedExecution}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Container>
  );
}
