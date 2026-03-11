import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';

/**
 * Global hook that subscribes to document and bookmark WebSocket events and
 * invalidates the relevant React Query caches. Register once in Layout.tsx.
 */
export function useDocumentQueryUpdates() {
  const queryClient = useQueryClient();
  const {
    subscribeToDocumentAdded,
    subscribeToDocumentUpdated,
    subscribeToDocumentRemoved,
    subscribeToBookmarkChanged,
  } = useXerroWebSocketContext();

  useEffect(() => {
    const invalidateDocumentNav = () => {
      queryClient.invalidateQueries({ queryKey: ['documents-nav'] });
      queryClient.invalidateQueries({ queryKey: ['documents-search'] });
    };

    const unsubAdded = subscribeToDocumentAdded(invalidateDocumentNav);

    const unsubUpdated = subscribeToDocumentUpdated((data) => {
      invalidateDocumentNav();
      queryClient.removeQueries({ queryKey: ['document', data.path] });
    });

    const unsubRemoved = subscribeToDocumentRemoved((data) => {
      invalidateDocumentNav();
      queryClient.removeQueries({ queryKey: ['document', data.path] });
    });

    const unsubBookmark = subscribeToBookmarkChanged(() => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    });

    return () => {
      unsubAdded();
      unsubUpdated();
      unsubRemoved();
      unsubBookmark();
    };
  }, [queryClient, subscribeToDocumentAdded, subscribeToDocumentUpdated, subscribeToDocumentRemoved, subscribeToBookmarkChanged]);
}
