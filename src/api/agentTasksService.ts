import { toast } from "@/hooks/use-toast";
import type {
  ScheduledTask,
  ScheduledTaskListResponse,
  TaskExecution,
  ToolsResponse,
  AgentExecutionTrace,
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
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}/executions?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch task executions: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.executions || [];
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch task executions";
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

  async triggerTask(id: string, withTrace: boolean = false): Promise<TaskExecution> {
    try {
      // Enable trace by updating task properties temporarily
      if (withTrace) {
        const task = await this.getTask(id);
        const updatedProperties = { ...task.properties, trace: true };
        await this.updateTask(id, { properties: updatedProperties });
      }

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

      // Restore original trace setting
      if (withTrace) {
        const task = await this.getTask(id);
        const restoredProperties = { ...task.properties };
        delete restoredProperties.trace;
        await this.updateTask(id, { properties: restoredProperties });
      }

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

  async updateTask(
    id: string,
    updates: {
      name?: string;
      description?: string;
      enabled?: boolean;
      properties?: Record<string, unknown>;
    }
  ): Promise<ScheduledTask> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Task updated",
        description: "Configuration saved successfully",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update task";
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

  async getTools(): Promise<ToolsResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/tools`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tools";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async clearScratchpad(id: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}/scratchpad`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to clear scratchpad: ${response.statusText}`
        );
      }

      const result = await response.json();

      toast({
        title: "Scratchpad cleared",
        description: "The scratchpad has been cleared successfully",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to clear scratchpad";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getTrace(id: string): Promise<{ path: string; trace: AgentExecutionTrace | null; isEmpty: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/scheduled-tasks/${id}/trace`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch trace: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch trace";
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
