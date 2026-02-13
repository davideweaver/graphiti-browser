import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';

/**
 * Hook to listen for real-time task configuration updates via WebSocket
 * and automatically refresh the task lists.
 *
 * Features:
 * - Invalidates React Query caches for task-related queries
 * - Refetches history, scratchpad, and traces on task updates
 * - Handles task created/updated/deleted events
 */
export function useTaskConfigUpdates() {
  const { subscribeToTaskCreated, subscribeToTaskUpdated, subscribeToTaskDeleted } =
    useXerroWebSocketContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to task created events
    const unsubscribeCreated = subscribeToTaskCreated((event) => {
      console.log('[Task Config] Task created:', event.taskName);

      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-nav'] });
    });

    // Subscribe to task updated events
    const unsubscribeUpdated = subscribeToTaskUpdated((event) => {
      console.log('[Task Config] Task updated:', event.taskName);

      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-nav'] });
      queryClient.invalidateQueries({ queryKey: ['agent-task', event.taskId] });
      queryClient.invalidateQueries({ queryKey: ['agent-task-history', event.taskId] });
      queryClient.invalidateQueries({ queryKey: ['agent-task-scratchpad', event.taskId] });
      queryClient.invalidateQueries({ queryKey: ['agent-task-trace', event.taskId] });
    });

    // Subscribe to task deleted events
    const unsubscribeDeleted = subscribeToTaskDeleted((event) => {
      console.log('[Task Config] Task deleted:', event.taskName);

      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-nav'] });
      queryClient.invalidateQueries({ queryKey: ['agent-task', event.taskId] });
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribeToTaskCreated, subscribeToTaskUpdated, subscribeToTaskDeleted, queryClient]);
}
