// WebSocket connection states
export type ConnectionState = "connected" | "disconnected" | "reconnecting" | "error";

// Base event structure
interface BaseEvent {
  event_type: string;
  group_id: string;
  timestamp: string;
}

// Entity events
export interface EntityCreatedEvent extends BaseEvent {
  event_type: "entity.created";
  data: {
    uuid: string;
    name: string;
    summary: string;
    labels: string[];
    attributes: Record<string, unknown>;
    created_at: string;
  };
}

export interface EntityDeletedEvent extends BaseEvent {
  event_type: "entity.deleted";
  data: {
    uuid: string;
  };
}

// Edge events
export interface EdgeCreatedEvent extends BaseEvent {
  event_type: "edge.created";
  data: {
    uuid: string;
    source_node_uuid: string;
    target_node_uuid: string;
    name: string;
    fact: string;
    valid_at: string;
    created_at: string;
  };
}

export interface EdgeDeletedEvent extends BaseEvent {
  event_type: "edge.deleted";
  data: {
    uuid: string;
  };
}

// Episode events
export interface EpisodeCreatedEvent extends BaseEvent {
  event_type: "episode.created";
  data: {
    uuid: string;
    name: string;
    content: string;
    source_description: string;
    session_id: string;
    timestamp: string;
    created_at: string;
    valid_at: string;
  };
}

export interface EpisodeDeletedEvent extends BaseEvent {
  event_type: "episode.deleted";
  data: {
    uuid: string;
    session_id?: string;
  };
}

// Group events
export interface GroupDeletedEvent extends BaseEvent {
  event_type: "group.deleted";
  data: {
    deleted_edges: number;
    deleted_nodes: number;
    deleted_episodes: number;
  };
}

// Session events
export interface SessionDeletedEvent extends BaseEvent {
  event_type: "session.deleted";
  data: {
    session_id: string;
    uuid: string;
    episode_count: number;
  };
}

// Project events
export interface ProjectDeletedEvent extends BaseEvent {
  event_type: "project.deleted";
  data: {
    project_name: string;
    deleted_sessions: number;
    deleted_episodes: number;
  };
}

// Queue status events
export interface QueueStatusEvent extends BaseEvent {
  event_type: "queue.status";
  data: {
    queue_size: number;          // Items waiting in queue
    processing_count: number;    // Items being processed
    total_pending: number;       // Total work remaining (queue_size + processing_count)
    is_processing: boolean;      // true if total_pending > 0
  };
}

// Union type for all events
export type WebSocketEvent =
  | EntityCreatedEvent
  | EntityDeletedEvent
  | EdgeCreatedEvent
  | EdgeDeletedEvent
  | EpisodeCreatedEvent
  | EpisodeDeletedEvent
  | SessionDeletedEvent
  | GroupDeletedEvent
  | ProjectDeletedEvent
  | QueueStatusEvent;

// Event handler types
export type EventHandler<T = unknown> = (event: T) => void;
export type StateChangeHandler = (state: ConnectionState) => void;
