import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';

/**
 * Hook to listen for agent completion events via WebSocket
 * and automatically refresh related data (history, scratchpad, traces).
 *
 * This hook handles the completion lifecycle:
 * - Completed tasks - successful completion
 * - Cancelled tasks - user-cancelled execution
 * - Error tasks - failed execution
 *
 * It invalidates React Query caches for:
 * - Task execution history
 * - Task scratchpad
 * - Task traces
 */
export function useAgentCompletionUpdates() {
  const { subscribeToAgentStatus } = useXerroWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToAgentStatus((event) => {
      // Only handle terminal states
      if (
        event.status === 'completed' ||
        event.status === 'cancelled' ||
        event.status === 'error'
      ) {
        console.log('[Agent Completion] Task finished:', event.taskName, event.status);

        // Invalidate history, scratchpad, and traces for this task
        queryClient.invalidateQueries({ queryKey: ['agent-task-history', event.taskId] });
        queryClient.invalidateQueries({ queryKey: ['agent-task-scratchpad', event.taskId] });
        queryClient.invalidateQueries({ queryKey: ['agent-task-trace', event.taskId] });
      }
    });

    return unsubscribe;
  }, [subscribeToAgentStatus, queryClient]);
}
