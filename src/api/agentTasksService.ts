import { toast } from "@/hooks/use-toast";
import type {
  ScheduledTask,
  ScheduledTaskListResponse,
  TaskExecution,
} from "@/types/agentTasks";

class AgentTasksService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_XERRO_SERVICE_URL || "";
    if (!this.baseUrl) {
      console.warn(
        "VITE_XERRO_SERVICE_URL not configured. Agent Tasks may not work."
      );
    }
  }

  async listTasks(
    enabled?: boolean,
    task?: string
  ): Promise<ScheduledTaskListResponse> {
    try {
      const params = new URLSearchParams();
      if (enabled !== undefined) {
        params.append("enabled", String(enabled));
      }
      if (task) {
        params.append("task", task);
      }

      const url = `${this.baseUrl}/api/v1/scheduled-tasks${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tasks";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getTask(id: string): Promise<ScheduledTask> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch task: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch task";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getTaskHistory(
    id: string,
    limit: number = 20
  ): Promise<TaskExecution[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}/history?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch task history: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.executions || [];
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch task history";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getRecentRuns(limit: number = 50): Promise<Array<TaskExecution & { taskId: string; taskName: string }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/executions?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch task history: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.executions || [];
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch task history";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getScratchpad(id: string): Promise<{ path: string; content: unknown; isEmpty: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}/scratchpad`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch scratchpad: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch scratchpad";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async triggerTask(id: string): Promise<TaskExecution> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}/run`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to trigger task: ${response.statusText}`
        );
      }

      const execution = await response.json();

      toast({
        title: "Task triggered",
        description: execution.success
          ? "Task executed successfully"
          : "Task execution failed",
        variant: execution.success ? "default" : "destructive",
      });

      return execution;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to trigger task";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async deleteTask(id: string): Promise<{ success: boolean; id: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete task: ${response.statusText}`
        );
      }

      const result = await response.json();

      toast({
        title: "Task deleted",
        description: "The task has been permanently deleted",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete task";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }
}

export const agentTasksService = new AgentTasksService();
