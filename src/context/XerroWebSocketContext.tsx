import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { AgentStatusEvent, DocumentChangeEvent } from '@/types/websocket';

interface XerroWebSocketContextValue {
  isConnected: boolean;
  socket: Socket | null;
  subscribeToAgentStatus: (callback: (event: AgentStatusEvent) => void) => () => void;
  subscribeToDocumentAdded: (callback: (event: DocumentChangeEvent) => void) => () => void;
  subscribeToDocumentUpdated: (callback: (event: DocumentChangeEvent) => void) => () => void;
  subscribeToDocumentRemoved: (callback: (event: DocumentChangeEvent) => void) => () => void;
}

const XerroWebSocketContext = createContext<XerroWebSocketContextValue | undefined>(undefined);

export function XerroWebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Subscription callbacks
  const agentStatusCallbacksRef = useRef<Set<(event: AgentStatusEvent) => void>>(new Set());
  const documentAddedCallbacksRef = useRef<Set<(event: DocumentChangeEvent) => void>>(new Set());
  const documentUpdatedCallbacksRef = useRef<Set<(event: DocumentChangeEvent) => void>>(new Set());
  const documentRemovedCallbacksRef = useRef<Set<(event: DocumentChangeEvent) => void>>(new Set());

  useEffect(() => {
    const url = import.meta.env.VITE_XERRO_SERVICE_URL || 'http://localhost:9205';

    // Create socket connection
    const socket = io(url, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('[Xerro WebSocket] Connected:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('[Xerro WebSocket] Disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('[Xerro WebSocket] Connection error:', error);
      setIsConnected(false);
    });

    // Available events list
    socket.on('events:list', (events: string[]) => {
      console.log('[Xerro WebSocket] Available events:', events);
    });

    // Agent status events - notify all subscribers
    socket.on('scheduled-tasks:agent-status', (data: AgentStatusEvent) => {
      console.log('[Xerro WebSocket] Agent status:', data.status, data.taskName);
      agentStatusCallbacksRef.current.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[Xerro WebSocket] Error in agent status callback:', error);
        }
      });
    });

    // Document events - notify all subscribers
    socket.on('obsidian:document-added', (data: DocumentChangeEvent) => {
      console.log('[Xerro WebSocket] Document added:', data.path);
      documentAddedCallbacksRef.current.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[Xerro WebSocket] Error in document added callback:', error);
        }
      });
    });

    socket.on('obsidian:document-updated', (data: DocumentChangeEvent) => {
      console.log('[Xerro WebSocket] Document updated:', data.path);
      documentUpdatedCallbacksRef.current.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[Xerro WebSocket] Error in document updated callback:', error);
        }
      });
    });

    socket.on('obsidian:document-removed', (data: DocumentChangeEvent) => {
      console.log('[Xerro WebSocket] Document removed:', data.path);
      documentRemovedCallbacksRef.current.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[Xerro WebSocket] Error in document removed callback:', error);
        }
      });
    });

    // Cleanup on unmount
    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // Subscribe to agent status events
  const subscribeToAgentStatus = useCallback((callback: (event: AgentStatusEvent) => void) => {
    agentStatusCallbacksRef.current.add(callback);
    return () => {
      agentStatusCallbacksRef.current.delete(callback);
    };
  }, []);

  // Subscribe to document added events
  const subscribeToDocumentAdded = useCallback((callback: (event: DocumentChangeEvent) => void) => {
    documentAddedCallbacksRef.current.add(callback);
    return () => {
      documentAddedCallbacksRef.current.delete(callback);
    };
  }, []);

  // Subscribe to document updated events
  const subscribeToDocumentUpdated = useCallback((callback: (event: DocumentChangeEvent) => void) => {
    documentUpdatedCallbacksRef.current.add(callback);
    return () => {
      documentUpdatedCallbacksRef.current.delete(callback);
    };
  }, []);

  // Subscribe to document removed events
  const subscribeToDocumentRemoved = useCallback((callback: (event: DocumentChangeEvent) => void) => {
    documentRemovedCallbacksRef.current.add(callback);
    return () => {
      documentRemovedCallbacksRef.current.delete(callback);
    };
  }, []);

  const value: XerroWebSocketContextValue = {
    isConnected,
    socket: socketRef.current,
    subscribeToAgentStatus,
    subscribeToDocumentAdded,
    subscribeToDocumentUpdated,
    subscribeToDocumentRemoved,
  };

  return (
    <XerroWebSocketContext.Provider value={value}>
      {children}
    </XerroWebSocketContext.Provider>
  );
}

export function useXerroWebSocketContext() {
  const context = useContext(XerroWebSocketContext);
  if (context === undefined) {
    throw new Error('useXerroWebSocketContext must be used within XerroWebSocketProvider');
  }
  return context;
}
