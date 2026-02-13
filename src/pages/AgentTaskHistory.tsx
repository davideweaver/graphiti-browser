import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Container from "@/components/container/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { agentTasksService } from "@/api/agentTasksService";
import { TaskExecutionSheet } from "@/components/tasks/TaskExecutionSheet";
import { TaskExecutionRow } from "@/components/tasks/TaskExecutionRow";
import { useTaskConfigUpdates } from "@/hooks/use-task-config-updates";
import type { TaskExecution } from "@/types/agentTasks";

export default function AgentTaskHistory() {
  const navigate = useNavigate();
  const [selectedExecution, setSelectedExecution] =
    useState<TaskExecution | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Listen for real-time task configuration updates
  useTaskConfigUpdates();

  const { data: recentRuns, isLoading } = useQuery({
    queryKey: ["agent-task-history"],
    queryFn: () => agentTasksService.getRecentRuns(50),
  });

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
            <TaskExecutionRow
              key={index}
              execution={execution}
              onClick={() => {
                setSelectedExecution(execution);
                setSheetOpen(true);
              }}
              showTaskName={true}
              onTaskNameClick={() => navigate(`/agent-tasks/${execution.taskId}`)}
            />
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
