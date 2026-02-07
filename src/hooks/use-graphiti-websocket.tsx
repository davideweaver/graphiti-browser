import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { websocketService } from "@/api/websocketService";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import type { ConnectionState } from "@/types/websocket";
import type {
  EntityCreatedEvent,
  EntityDeletedEvent,
  EdgeCreatedEvent,
  EdgeDeletedEvent,
  EpisodeCreatedEvent,
  EpisodeDeletedEvent,
  SessionDeletedEvent,
  GroupDeletedEvent,
  ProjectDeletedEvent,
  QueueStatusEvent,
} from "@/types/websocket";
import type { Entity, Episode } from "@/types/graphiti";

// Derive WebSocket URL from Graphiti server URL
const graphitiServer = import.meta.env.VITE_GRAPHITI_SERVER || "http://localhost:8000";
const WS_BASE_URL = graphitiServer
  .replace(/^http:/, "ws:")
  .replace(/^https:/, "wss:") + "/ws";

interface UseGraphitiWebSocketReturn {
  connectionState: ConnectionState;
  isConnected: boolean;
  error: string | null;
  queueSize: number;
  isProcessing: boolean;
}

export function useGraphitiWebSocket(): UseGraphitiWebSocketReturn {
  const { groupId } = useGraphiti();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    websocketService.getConnectionState()
  );
  const [error, setError] = useState<string | null>(null);
  const [queueSize, setQueueSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect(WS_BASE_URL, groupId);

    // Register event handlers
    const unsubscribers = [
      // Entity events
      websocketService.addEventListener("entity.created", (event) => {
        const typedEvent = event as EntityCreatedEvent;
        handleEntityCreated(typedEvent, groupId, queryClient);
      }),
      websocketService.addEventListener("entity.deleted", (event) => {
        const typedEvent = event as EntityDeletedEvent;
        handleEntityDeleted(typedEvent, groupId, queryClient);
      }),

      // Edge events
      websocketService.addEventListener("edge.created", (event) => {
        const typedEvent = event as EdgeCreatedEvent;
        handleEdgeCreated(typedEvent, groupId, queryClient);
      }),
      websocketService.addEventListener("edge.updated", (event) => {
        const typedEvent = event as any; // edge.updated event
        handleEdgeUpdated(typedEvent, groupId, queryClient);
      }),
      websocketService.addEventListener("edge.deleted", (event) => {
        const typedEvent = event as EdgeDeletedEvent;
        handleEdgeDeleted(typedEvent, groupId, queryClient);
      }),

      // Episode events
      websocketService.addEventListener("episode.created", (event) => {
        const typedEvent = event as EpisodeCreatedEvent;
        handleEpisodeCreated(typedEvent, groupId, queryClient);
      }),
      websocketService.addEventListener("episode.deleted", (event) => {
        const typedEvent = event as EpisodeDeletedEvent;
        handleEpisodeDeleted(typedEvent, groupId, queryClient);
      }),

      // Session events
      websocketService.addEventListener("session.deleted", (event) => {
        const typedEvent = event as SessionDeletedEvent;
        handleSessionDeleted(typedEvent, groupId, queryClient);
      }),

      // Group events
      websocketService.addEventListener("group.deleted", (event) => {
        const typedEvent = event as GroupDeletedEvent;
        handleGroupDeleted(typedEvent, groupId, queryClient);
      }),

      // Project events
      websocketService.addEventListener("project.deleted", (event) => {
        const typedEvent = event as ProjectDeletedEvent;
        handleProjectDeleted(typedEvent, groupId, queryClient);
      }),

      // Queue status events
      websocketService.addEventListener("queue.status", (event) => {
        const typedEvent = event as QueueStatusEvent;
        // Use total_pending instead of queue_size for accurate count
        setQueueSize(typedEvent.data.total_pending);
        setIsProcessing(typedEvent.data.is_processing);
      }),
    ];

    // Listen to connection state changes
    const unsubState = websocketService.addStateListener((state) => {
      setConnectionState(state);
      if (state === "error") {
        setError("Connection error");
      } else {
        setError(null);
      }
    });

    // Cleanup on unmount
    return () => {
      unsubscribers.forEach((unsub) => unsub());
      unsubState();
      websocketService.disconnect();
    };
  }, [groupId, queryClient]);

  return {
    connectionState,
    isConnected: connectionState === "connected",
    error,
    queueSize,
    isProcessing,
  };
}

/**
 * Handle entity.created event
 * Strategy: Invalidate all entity list queries to trigger refetch
 */
function handleEntityCreated(
  event: EntityCreatedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  console.log("🔵 handleEntityCreated called");
  console.log("🔵 Event JSON:", JSON.stringify(event, null, 2));
  console.log("🔵 event.group_id:", event.group_id);
  console.log("🔵 event.data:", event.data);
  console.log("🔵 event keys:", Object.keys(event));

  if (event.group_id !== groupId) {
    console.debug(`Ignoring entity.created for different group: ${event.group_id}`);
    return;
  }

  const entity = event.data;
  console.log("📬 Entity created:", entity?.uuid || "UUID IS NULL", entity?.name || "NAME IS NULL");
  console.log("📬 Entity data:", entity);

  // Invalidate all entities-list queries (includes pagination/filter params)
  queryClient.invalidateQueries({
    queryKey: ["entities-list", groupId],
  });

  // Invalidate entities-all-types query (used for filter dropdown)
  queryClient.invalidateQueries({
    queryKey: ["entities-all-types", groupId],
  });
}

/**
 * Handle entity.deleted event
 * Strategy: Remove from cache immediately and invalidate all entity list queries
 */
function handleEntityDeleted(
  event: EntityDeletedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring entity.deleted for different group: ${event.group_id}`);
    return;
  }

  const { uuid } = event.data;
  console.log("📬 Entity deleted:", uuid);

  // Remove from single entity cache
  queryClient.removeQueries({ queryKey: ["entity", uuid] });

  // Invalidate all entities-list queries (includes pagination/filter params)
  queryClient.invalidateQueries({
    queryKey: ["entities-list", groupId],
  });

  // Invalidate entities-all-types query (used for filter dropdown)
  queryClient.invalidateQueries({
    queryKey: ["entities-all-types", groupId],
  });

  // Invalidate related queries
  queryClient.invalidateQueries({
    queryKey: ["entity-relationships", uuid],
  });

  // Invalidate entity facts
  queryClient.invalidateQueries({
    queryKey: ["entity-facts", uuid],
  });
}

/**
 * Handle edge.created event
 * Strategy: Fetch full details, invalidate both entity relationships
 */
function handleEdgeCreated(
  event: EdgeCreatedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring edge.created for different group: ${event.group_id}`);
    return;
  }

  const { uuid, source_node_uuid, target_node_uuid } = event.data;
  console.log("📬 Edge created:", uuid);

  // Fetch full edge details (notification lacks source/target names)
  graphitiService
    .getEntityEdge(uuid)
    .then((edge) => {
      // Invalidate relationship queries for both entities
      queryClient.invalidateQueries({
        queryKey: ["entity-relationships", edge.source_node_uuid],
      });
      queryClient.invalidateQueries({
        queryKey: ["entity-relationships", edge.target_node_uuid],
      });
    })
    .catch((err) => {
      console.error("Failed to fetch edge details:", err);
      // Fallback: Invalidate relationships for UUIDs from notification
      queryClient.invalidateQueries({
        queryKey: ["entity-relationships", source_node_uuid],
      });
      queryClient.invalidateQueries({
        queryKey: ["entity-relationships", target_node_uuid],
      });
    });
}

/**
 * Handle edge.updated event
 * Strategy: Invalidate all queries that might display this fact
 */
function handleEdgeUpdated(
  event: any,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring edge.updated for different group: ${event.group_id}`);
    return;
  }

  const { uuid, fact } = event.data;
  console.log("📬 Edge updated:", uuid, "New fact:", fact);

  // Invalidate search queries (fact text/embedding changed)
  // Use refetchType: "active" to force immediate refetch if search page is viewing
  queryClient.invalidateQueries({
    queryKey: ["search"],
    refetchType: "active",
  });

  // Invalidate entity facts (fact appears in entity detail pages)
  queryClient.invalidateQueries({
    queryKey: ["entity-facts"],
  });

  // Invalidate relationships (facts are relationships)
  queryClient.invalidateQueries({
    queryKey: ["entity-relationships"],
    refetchType: "active",
  });
}

/**
 * Handle edge.deleted event
 * Strategy: Invalidate all relationship queries
 */
function handleEdgeDeleted(
  event: EdgeDeletedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring edge.deleted for different group: ${event.group_id}`);
    return;
  }

  const { uuid } = event.data;
  console.log("📬 Edge deleted:", uuid);

  // Invalidate all relationship queries (don't know which entities)
  queryClient.invalidateQueries({
    queryKey: ["entity-relationships"],
    refetchType: "active", // Only refetch if currently viewing
  });
}

/**
 * Handle episode.created event
 * Strategy: Invalidate episodes, sessions, AND entities (entities are extracted with episodes)
 */
function handleEpisodeCreated(
  event: EpisodeCreatedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  console.log("🔵 handleEpisodeCreated called");
  console.log("🔵 Event JSON:", JSON.stringify(event, null, 2));
  console.log("🔵 event.group_id:", event.group_id);
  console.log("🔵 event.data:", event.data);
  console.log("🔵 event keys:", Object.keys(event));

  if (event.group_id !== groupId) {
    console.debug(`Ignoring episode.created for different group: ${event.group_id}`);
    return;
  }

  const episode = event.data;
  console.log("📬 Episode created:", episode?.uuid || "UUID IS NULL/UNDEFINED");
  console.log("📬 Episode data:", episode);

  // WebSocket event only includes partial data (uuid, name, session_id)
  // We need to invalidate queries to refetch complete data instead of caching partial data
  console.log("🔄 Invalidating queries to refetch complete episode data");

  // Invalidate episodes and sessions
  queryClient.invalidateQueries({
    queryKey: ["episodes", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["sessions", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["session-stats-by-day", groupId],
  });

  // Invalidate entities - they are extracted during episode processing
  // Note: Server emits entity.created only for explicit creation via /entity-node
  // During content processing (/messages, /content), entities are created in bulk without events
  queryClient.invalidateQueries({
    queryKey: ["entities-list", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["entities-all-types", groupId],
  });

  // Invalidate all entity-specific queries (facts and relationships for all entities)
  // New facts/relationships may have been created during episode processing
  queryClient.invalidateQueries({
    queryKey: ["entity-facts"],
  });
  queryClient.invalidateQueries({
    queryKey: ["entity-relationships"],
  });

  // If the episode belongs to a session being viewed, invalidate that session
  if (episode?.session_id) {
    queryClient.invalidateQueries({
      queryKey: ["session", groupId, episode.session_id],
    });
  }

  console.log("✅ All queries invalidated - UI will refresh");
}

/**
 * Handle episode.deleted event
 * Strategy: Remove from cache immediately
 */
function handleEpisodeDeleted(
  event: EpisodeDeletedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring episode.deleted for different group: ${event.group_id}`);
    return;
  }

  const { uuid, session_id } = event.data;
  console.log("📬 Episode deleted:", uuid);

  // Remove from cache
  queryClient.setQueryData<Episode[]>(["episodes", groupId], (old) => {
    if (!old) return old;
    const exists = old.some((e) => e.uuid === uuid);
    if (!exists) {
      console.debug("Episode already removed from cache");
      return old;
    }
    return old.filter((e) => e.uuid !== uuid);
  });

  // Invalidate sessions queries to update sessions list and day navigation
  queryClient.invalidateQueries({
    queryKey: ["sessions", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["session-stats-by-day", groupId],
  });

  // If the episode belonged to a session being viewed, invalidate that session
  if (session_id) {
    queryClient.invalidateQueries({
      queryKey: ["session", groupId, session_id],
    });
  }
}

/**
 * Handle session.deleted event
 * Strategy: Remove from cache and invalidate related queries
 */
function handleSessionDeleted(
  event: SessionDeletedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring session.deleted for different group: ${event.group_id}`);
    return;
  }

  const { session_id } = event.data;

  // Directly remove the session from cached data
  const queryCache = queryClient.getQueryCache();
  queryCache.getAll().forEach(query => {
    const key = query.queryKey;
    if ((key[0] === "sessions" || key[0] === "project-sessions") && key[1] === groupId) {
      queryClient.setQueryData(key, (oldData: any) => {
        if (!oldData?.sessions) return oldData;
        const filtered = oldData.sessions.filter(
          (s: any) => s.session_id !== session_id
        );
        if (filtered.length !== oldData.sessions.length) {
          return { ...oldData, sessions: filtered };
        }
        return oldData;
      });
    }
  });

  // Invalidate session detail queries
  queryClient.invalidateQueries({
    queryKey: ["session", groupId, session_id],
  });

  // Invalidate session stats for day navigation
  queryClient.invalidateQueries({
    queryKey: ["session-stats-by-day", groupId],
  });
}

/**
 * Handle project.deleted event
 * Strategy: Invalidate all project-related queries
 */
function handleProjectDeleted(
  event: ProjectDeletedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring project.deleted for different group: ${event.group_id}`);
    return;
  }

  const { project_name, deleted_sessions, deleted_episodes } = event.data;
  console.log("📬 Project deleted:", project_name, `(${deleted_sessions} sessions, ${deleted_episodes} episodes)`);

  // Invalidate all project list queries (includes pagination/filter params)
  queryClient.invalidateQueries({
    queryKey: ["projects-list", groupId],
  });

  // Invalidate the projects-nav-list query used by ProjectsSecondaryNav
  queryClient.invalidateQueries({
    queryKey: ["projects-nav-list", groupId],
  });

  // Invalidate sessions queries (sessions belong to projects)
  queryClient.invalidateQueries({
    queryKey: ["sessions", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["session-stats-by-day", groupId],
  });

  // Notify user
  toast.success(`Project "${project_name}" deleted (${deleted_sessions} sessions, ${deleted_episodes} episodes)`);
}

/**
 * Handle group.deleted event
 * Strategy: Clear all caches
 */
function handleGroupDeleted(
  event: GroupDeletedEvent,
  groupId: string,
  queryClient: ReturnType<typeof useQueryClient>
): void {
  if (event.group_id !== groupId) {
    console.debug(`Ignoring group.deleted for different group: ${event.group_id}`);
    return;
  }

  console.log("📬 Group deleted - clearing all caches");

  // Nuclear option: Clear ALL caches
  queryClient.clear();

  // Notify user
  toast.error("Your memory group has been deleted");
}
