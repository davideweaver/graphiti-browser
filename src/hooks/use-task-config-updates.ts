import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';
import { toast } from 'sonner';

/**
 * Hook to listen for real-time task configuration updates via WebSocket
 * and automatically refresh the task lists.
 *
 * Features:
 * - Invalidates React Query caches for task-related queries
 * - Shows toast notifications for task changes
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

      // Show toast notification
      toast.success(`Task created: ${event.taskName}`);
    });

    // Subscribe to task updated events
    const unsubscribeUpdated = subscribeToTaskUpdated((event) => {
      console.log('[Task Config] Task updated:', event.taskName);

      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-nav'] });
      queryClient.invalidateQueries({ queryKey: ['agent-task', event.taskId] });
      queryClient.invalidateQueries({ queryKey: ['agent-task-history', event.taskId] });

      // Show toast notification
      toast.info(`Task updated: ${event.taskName}`);
    });

    // Subscribe to task deleted events
    const unsubscribeDeleted = subscribeToTaskDeleted((event) => {
      console.log('[Task Config] Task deleted:', event.taskName);

      // Invalidate all task-related queries
      queryClient.invalidateQueries({ queryKey: ['agent-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['agent-tasks-nav'] });
      queryClient.invalidateQueries({ queryKey: ['agent-task', event.taskId] });

      // Show toast notification
      toast.warning(`Task deleted: ${event.taskName}`);
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribeToTaskCreated, subscribeToTaskUpdated, subscribeToTaskDeleted, queryClient]);
}
