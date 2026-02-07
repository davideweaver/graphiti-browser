import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { agentTasksService } from "@/api/agentTasksService";
import Container from "@/components/container/Container";
import { Skeleton } from "@/components/ui/skeleton";

export default function AgentTasks() {
  const navigate = useNavigate();

  // Fetch first task to redirect to
  const { data, isLoading } = useQuery({
    queryKey: ["agent-tasks-redirect"],
    queryFn: async () => {
      return await agentTasksService.listTasks();
    },
  });

  // Redirect to first task when data loads
  useEffect(() => {
    if (data && data.tasks.length > 0) {
      navigate(`/agent-tasks/${data.tasks[0].id}`, { replace: true });
    }
  }, [data, navigate]);

  if (isLoading) {
    return (
      <Container title="Agent Tasks" description="Loading tasks...">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-8 w-32" />
        </div>
      </Container>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <Container title="Agent Tasks" description="No tasks found">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            No agent tasks available.
          </p>
        </div>
      </Container>
    );
  }

  return null;
}
