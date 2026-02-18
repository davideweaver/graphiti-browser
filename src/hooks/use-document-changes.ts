import { useEffect } from 'react';
import { useXerroWebSocketContext } from '@/context/XerroWebSocketContext';
import type { DocumentChangeEvent, BookmarkChangeEvent } from '@/types/websocket';

interface UseDocumentChangesOptions {
  onAdded?: (event: DocumentChangeEvent) => void;
  onUpdated?: (event: DocumentChangeEvent) => void;
  onRemoved?: (event: DocumentChangeEvent) => void;
  onBookmarkChanged?: (event: BookmarkChangeEvent) => void;
}

/**
 * Hook to subscribe to Obsidian document change events from xerro-service
 *
 * @param options - Callbacks for different document change types
 * @returns Connection state
 *
 * @example
 * ```tsx
 * const { isConnected } = useDocumentChanges({
 *   onAdded: (event) => {
 *     console.log('Document added:', event.path);
 *     toast.success(`New document: ${event.path}`);
 *   },
 *   onUpdated: (event) => {
 *     console.log('Document updated:', event.path);
 *     // Refresh document list or show notification
 *   },
 *   onRemoved: (event) => {
 *     console.log('Document removed:', event.path);
 *   },
 * });
 * ```
 */
export function useDocumentChanges(options: UseDocumentChangesOptions = {}) {
  const {
    isConnected,
    subscribeToDocumentAdded,
    subscribeToDocumentUpdated,
    subscribeToDocumentRemoved,
    subscribeToBookmarkChanged,
  } = useXerroWebSocketContext();

  const { onAdded, onUpdated, onRemoved, onBookmarkChanged } = options;

  useEffect(() => {
    if (!onAdded) return;
    const unsubscribe = subscribeToDocumentAdded(onAdded);
    return unsubscribe;
  }, [onAdded, subscribeToDocumentAdded]);

  useEffect(() => {
    if (!onUpdated) return;
    const unsubscribe = subscribeToDocumentUpdated(onUpdated);
    return unsubscribe;
  }, [onUpdated, subscribeToDocumentUpdated]);

  useEffect(() => {
    if (!onRemoved) return;
    const unsubscribe = subscribeToDocumentRemoved(onRemoved);
    return unsubscribe;
  }, [onRemoved, subscribeToDocumentRemoved]);

  useEffect(() => {
    if (!onBookmarkChanged) return;
    const unsubscribe = subscribeToBookmarkChanged(onBookmarkChanged);
    return unsubscribe;
  }, [onBookmarkChanged, subscribeToBookmarkChanged]);

  return { isConnected };
}
