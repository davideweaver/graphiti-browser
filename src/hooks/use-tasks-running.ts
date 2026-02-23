import { useState, useEffect } from "react";
import { useAgentStatus } from "./use-agent-status";
import { agentTasksService } from "@/api/agentTasksService";
import type { AgentStatusEvent } from "@/types/websocket";

/**
 * Lightweight hook to track if any agent tasks are currently running.
 * Fetches initial state on mount, then uses WebSocket for real-time updates.
 * Returns true if any tasks are running, false otherwise.
 */
export function useTasksRunning(): boolean {
  const [runningTaskIds, setRunningTaskIds] = useState<Set<string>>(new Set());

  // Fetch initial running tasks on mount
  useEffect(() => {
    const fetchInitialRunningTasks = async () => {
      try {
        const response = await agentTasksService.getRunningTasks();
        const executionIds = response.executions.map((exec) => exec.executionId);
        setRunningTaskIds(new Set(executionIds));
      } catch (error) {
        console.error("Failed to fetch initial running tasks:", error);
      }
    };

    fetchInitialRunningTasks();
  }, []);

  // Subscribe to WebSocket updates for real-time changes
  useAgentStatus((event: AgentStatusEvent) => {
    setRunningTaskIds((prev) => {
      const updated = new Set(prev);

      if (event.status === 'completed' || event.status === 'cancelled' || event.status === 'error') {
        // Task finished - remove from set
        updated.delete(event.executionId);
      } else {
        // Task running - add to set
        updated.add(event.executionId);
      }

      return updated;
    });
  });

  return runningTaskIds.size > 0;
}
