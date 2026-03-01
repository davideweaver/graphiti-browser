import { toast } from "sonner";
import type {
  ConnectionState,
  EventHandler,
  StateChangeHandler,
  WebSocketEvent,
} from "@/types/websocket";

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000; // 30 seconds
  private maxReconnectAttempts = 10;
  private listeners = new Map<string, Set<EventHandler>>();
  private connectionState: ConnectionState = "disconnected";
  private stateListeners = new Set<StateChangeHandler>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastConnectTime = 0;
  private currentUrl = "";
  private currentGroupId = "";

  /**
   * Establish WebSocket connection
   */
  connect(baseUrl: string, groupId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Store for reconnection
    this.currentUrl = baseUrl;
    this.currentGroupId = groupId;

    const url = `${baseUrl}/${groupId}`;
    console.log(`Connecting to WebSocket: ${url}`);

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (event) => this.handleError(event);
      this.ws.onclose = (event) => this.handleClose(event);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.setConnectionState("error");
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState("disconnected");
  }

  /**
   * Register event listener for specific event type
   * Returns unsubscribe function
   */
  addEventListener(eventType: string, handler: EventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.listeners.get(eventType);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Register connection state change listener
   * Returns unsubscribe function
   */
  addStateListener(handler: StateChangeHandler): () => void {
    this.stateListeners.add(handler);

    // Return unsubscribe function
    return () => {
      this.stateListeners.delete(handler);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    const now = Date.now();
    const uptime = now - this.lastConnectTime;

    // If connection lasted < 5 seconds, it's unstable
    if (uptime < 5000 && this.reconnectAttempts > 0) {
      this.reconnectAttempts++; // Accelerate backoff
      console.warn("Unstable connection detected");
    } else {
      this.reconnectAttempts = 0; // Reset on stable connection
    }

    this.lastConnectTime = now;
    this.setConnectionState("connected");

    console.log("✅ WebSocket connected");
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    let payload: WebSocketEvent;

    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
      return;
    }

    const { event_type } = payload;

    if (!event_type) {
      console.warn("WebSocket message missing event_type:", payload);
      return;
    }

    // Known event types
    const knownTypes = [
      "entity.created",
      "entity.deleted",
      "edge.created",
      "edge.deleted",
      "episode.created",
      "episode.deleted",
      "session.deleted",
      "project.deleted",
      "group.deleted",
      "queue.status",
    ];

    if (!knownTypes.includes(event_type)) {
      console.warn(`Unknown WebSocket event type: ${event_type}`, payload);
      return;
    }

    // Skip logging for queue.status events (high frequency)
    if (event_type !== "queue.status") {
      console.log("📨 WebSocket raw message received:", event.data);
      console.log("📨 WebSocket parsed payload:", payload);
      console.log(`✅ Notifying listeners for ${event_type}`);
    }

    // Notify registered listeners
    this.notifyListeners(event_type, payload);
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error("WebSocket error:", event);
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log("WebSocket disconnected", event.code, event.reason);

    // Don't set error state on normal closure
    if (event.code !== 1000 && event.code !== 1001) {
      this.scheduleReconnect();
    } else {
      this.setConnectionState("disconnected");
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    // Stop after max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts exceeded");
      this.setConnectionState("error");
      toast.error("Unable to connect to real-time updates. Changes may not appear immediately.");
      return;
    }

    this.setConnectionState("reconnecting");

    const delay = this.getReconnectDelay();
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.currentUrl, this.currentGroupId);
    }, delay);
  }

  /**
   * Calculate exponential backoff delay
   */
  private getReconnectDelay(): number {
    // Exponential backoff: 2^n * 1000ms, capped at maxReconnectDelay
    return Math.min(
      Math.pow(2, this.reconnectAttempts) * 1000,
      this.maxReconnectDelay
    );
  }

  /**
   * Notify listeners for a specific event type
   */
  private notifyListeners(eventType: string, payload: WebSocketEvent): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.notifyStateChange(state);
    }
  }

  /**
   * Notify state change listeners
   */
  private notifyStateChange(state: ConnectionState): void {
    this.stateListeners.forEach((handler) => {
      try {
        handler(state);
      } catch (error) {
        console.error("Error in state change handler:", error);
      }
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
