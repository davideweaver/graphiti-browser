import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';

/**
 * Global hook that subscribes to memory session and project WebSocket events
 * and invalidates the relevant React Query caches. Register once in Layout.tsx.
 */
export function useMemoryQueryUpdates() {
  const queryClient = useQueryClient();
  const {
    subscribeToMemorySessionCreated,
    subscribeToMemorySessionUpdated,
    subscribeToMemorySessionDeleted,
    subscribeToMemoryProjectAdded,
    subscribeToMemoryProjectUpdated,
    subscribeToMemoryProjectDeleted,
  } = useXerroWebSocketContext();

  useEffect(() => {
    const unsubSessionCreated = subscribeToMemorySessionCreated(() => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['xerro-project-sessions'] });
    });

    const unsubSessionUpdated = subscribeToMemorySessionUpdated((data) => {
      queryClient.invalidateQueries({ queryKey: ['xerro-session', data.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['xerro-session-messages', data.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    });

    const unsubSessionDeleted = subscribeToMemorySessionDeleted((data) => {
      queryClient.removeQueries({ queryKey: ['xerro-session', data.sessionId] });
      queryClient.removeQueries({ queryKey: ['xerro-session-messages', data.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    });

    const invalidateProjectQueries = () => {
      queryClient.invalidateQueries({ queryKey: ['projects-nav-list'] });
      queryClient.invalidateQueries({ queryKey: ['xerro-project-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['xerro-project-metadata'] });
    };

    const unsubProjectAdded = subscribeToMemoryProjectAdded(invalidateProjectQueries);
    const unsubProjectUpdated = subscribeToMemoryProjectUpdated(invalidateProjectQueries);
    const unsubProjectDeleted = subscribeToMemoryProjectDeleted(invalidateProjectQueries);

    return () => {
      unsubSessionCreated();
      unsubSessionUpdated();
      unsubSessionDeleted();
      unsubProjectAdded();
      unsubProjectUpdated();
      unsubProjectDeleted();
    };
  }, [
    queryClient,
    subscribeToMemorySessionCreated,
    subscribeToMemorySessionUpdated,
    subscribeToMemorySessionDeleted,
    subscribeToMemoryProjectAdded,
    subscribeToMemoryProjectUpdated,
    subscribeToMemoryProjectDeleted,
  ]);
}
