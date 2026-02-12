import { useEffect } from 'react';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';
import type { AgentStatusEvent } from '@/types/websocket';

/**
 * Hook to subscribe to agent status events from xerro-service
 *
 * @param callback - Function to call when agent status events are received
 * @returns Connection state
 *
 * @example
 * ```tsx
 * const { isConnected } = useAgentStatus((event) => {
 *   console.log('Task status:', event.status, event.taskName);
 *   if (event.status === 'completed') {
 *     // Handle completion
 *   }
 * });
 * ```
 */
export function useAgentStatus(callback: (event: AgentStatusEvent) => void) {
  const { isConnected, subscribeToAgentStatus } = useXerroWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribeToAgentStatus(callback);
    return unsubscribe;
  }, [callback, subscribeToAgentStatus]);

  return { isConnected };
}
