import { useState } from "react";
import { useAgentStatus } from "./use-agent-status";
import type { AgentStatusEvent } from "@/types/websocket";

/**
 * Lightweight hook to track if any agent tasks are currently running.
 * Uses the same WebSocket connection as TaskActivity page - no additional overhead.
 * Returns true if any tasks are running, false otherwise.
 */
export function useTasksRunning(): boolean {
  const [runningTaskIds, setRunningTaskIds] = useState<Set<string>>(new Set());

  useAgentStatus((event: AgentStatusEvent) => {
    setRunningTaskIds((prev) => {
      const updated = new Set(prev);

      if (event.status === 'completed' || event.status === 'error') {
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
