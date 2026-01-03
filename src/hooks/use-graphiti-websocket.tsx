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
  GroupDeletedEvent,
  QueueStatusEvent,
} from "@/types/websocket";
import type { Entity, Episode } from "@/types/graphiti";

const WS_BASE_URL = "ws://172.16.0.14:3060/ws";

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

      // Group events
      websocketService.addEventListener("group.deleted", (event) => {
        const typedEvent = event as GroupDeletedEvent;
        handleGroupDeleted(typedEvent, groupId, queryClient);
      }),

      // Queue status events
      websocketService.addEventListener("queue.status", (event) => {
        const typedEvent = event as QueueStatusEvent;
        setQueueSize(typedEvent.data.queue_size);
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
 * Strategy: Add to cache directly (has summary), invalidate list
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

  // If UUID is missing, we can't add to cache - just invalidate to refetch
  if (!entity?.uuid) {
    console.log("⚠️ Entity UUID is null, invalidating query to refetch");
    queryClient.invalidateQueries({
      queryKey: ["entities-list", groupId],
    });
    return;
  }

  // Add to cache directly (has summary)
  queryClient.setQueryData<Entity[]>(["entities-list", groupId], (old) => {
    if (!old) return [entity as Entity];
    return [entity as Entity, ...old];
  });

  // Invalidate to refresh counts/pagination (don't refetch immediately)
  queryClient.invalidateQueries({
    queryKey: ["entities-list", groupId],
    refetchType: "none",
  });
}

/**
 * Handle entity.deleted event
 * Strategy: Remove from cache immediately
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

  // Remove from list cache
  queryClient.setQueryData<Entity[]>(["entities-list", groupId], (old) => {
    if (!old) return old;
    const exists = old.some((e) => e.uuid === uuid);
    if (!exists) {
      console.debug("Entity already removed from cache");
      return old;
    }
    return old.filter((e) => e.uuid !== uuid);
  });

  // Invalidate related queries
  queryClient.invalidateQueries({
    queryKey: ["entity-relationships", uuid],
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
 * Strategy: Add to cache directly (has all data)
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

  queryClient.invalidateQueries({
    queryKey: ["episodes", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["sessions", groupId],
  });
  queryClient.invalidateQueries({
    queryKey: ["session-stats-by-day", groupId],
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
