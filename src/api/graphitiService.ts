import { toast } from "sonner";
import type {
  SearchResponse,
  Episode,
  Message,
  Entity,
  EntityEdge,
  EntityListResponse,
  HealthCheckResponse,
  CreateEntityRequest,
  SessionListResponse,
  SessionStatsByDay,
  SessionDetailResponse,
  ProjectListResponse,
  ProjectStatsByDay,
  EpisodeListResponse,
  Fact,
  GraphNode,
  GraphEdge,
  NodeConnectionsResponse,
  EdgeConnectionsResponse,
  AddContentResponse,
  SourceExtractionResultsResponse,
  GroupsListResponse,
  DeleteGroupResponse,
  BackupGroupResponse,
} from "@/types/graphiti";

const BASE_URL = "/api";
const DEFAULT_GROUP_ID = import.meta.env.VITE_GROUP_ID;

class GraphitiService {
  private baseUrl: string;

  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic fetch wrapper with error handling
  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);

        // Don't show toast for 404 errors (entity not found)
        // These are expected when navigating to deleted entities or during race conditions
        if (response.status !== 404) {
          toast.error(`API Error: ${error.message}`);
        }

        console.error(`API Error [${endpoint}]:`, error);
        throw error;
      }

      // Handle empty responses (like DELETE)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      // If it's a network error (not HTTP error), show toast
      if (error instanceof TypeError) {
        console.error(`Network Error [${endpoint}]:`, error);
        toast.error(`Network Error: ${error.message}`);
      }
      throw error;
    }
  }

  // POST /search - Search for facts
  async search(
    query: string,
    groupId: string = DEFAULT_GROUP_ID,
    maxFacts = 10,
    startDate?: string,
    endDate?: string,
    centerNodeUuid?: string
  ): Promise<SearchResponse> {
    return this.fetch<SearchResponse>("/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        group_id: groupId,
        max_facts: maxFacts,
        start_date: startDate,
        end_date: endDate,
        center_node_uuid: centerNodeUuid,
      }),
    });
  }

  // GET /episodes/{group_id}?last_n=50&start_date=...&end_date=...&session_id=... - List episodes
  async getEpisodes(
    groupId = DEFAULT_GROUP_ID,
    lastN = 50,
    startDate?: string,
    endDate?: string,
    sessionId?: string
  ): Promise<Episode[]> {
    const params = new URLSearchParams({ last_n: lastN.toString() });

    if (startDate) {
      params.append("start_date", startDate);
    }
    if (endDate) {
      params.append("end_date", endDate);
    }
    if (sessionId) {
      params.append("session_id", sessionId);
    }

    return this.fetch<Episode[]>(`/episodes/${groupId}?${params.toString()}`);
  }

  // POST /messages - Add memories (async processing)
  async addMessages(
    messages: Message[],
    groupId = DEFAULT_GROUP_ID
  ): Promise<{ message: string; success: boolean }> {
    const response = await this.fetch<{ message: string; success: boolean }>(
      "/messages",
      {
        method: "POST",
        body: JSON.stringify({
          group_id: groupId,
          messages,
        }),
      }
    );

    toast.success("Memory added! Processing in background...");
    return response;
  }

  // POST /content - Add content with source tracking
  async addContent(params: {
    content: string;
    projectName: string | null;
    sourceName: string;
    sourceType: string;
    sourceMetadata: Record<string, any>;
    groupId: string;
  }): Promise<AddContentResponse> {
    const response = await this.fetch<AddContentResponse>("/content", {
      method: "POST",
      body: JSON.stringify({
        group_id: params.groupId,
        content: params.content,
        project_name: params.projectName || "_general",
        source_name: params.sourceName,
        source_type: params.sourceType,
        source_metadata: params.sourceMetadata,
      }),
    });

    toast.success("Content submitted! Extracting facts and entities...");
    return response;
  }

  // GET /sources/{group_id}/{source_uuid}/extraction-results - Get extraction results for a source
  async getSourceExtractionResults(
    sourceUuid: string,
    groupId = DEFAULT_GROUP_ID
  ): Promise<SourceExtractionResultsResponse> {
    return this.fetch<SourceExtractionResultsResponse>(
      `/sources/${groupId}/${sourceUuid}/extraction-results`
    );
  }

  // POST /entity-node - Create entity
  async createEntity(entity: CreateEntityRequest): Promise<Entity> {
    const response = await this.fetch<Entity>("/entity-node", {
      method: "POST",
      body: JSON.stringify(entity),
    });

    toast.success("Entity created");
    return response;
  }

  // DELETE /entities/{group_id}/{uuid} - Delete entity and all connected edges
  async deleteEntity(uuid: string, groupId = DEFAULT_GROUP_ID): Promise<void> {
    await this.fetch(`/entities/${groupId}/${uuid}`, {
      method: "DELETE",
    });

    toast.success("Entity deleted");
  }

  // DELETE /episode/{uuid} - Delete episode
  async deleteEpisode(uuid: string): Promise<void> {
    await this.fetch(`/episode/${uuid}`, {
      method: "DELETE",
    });

    toast.success("Episode deleted");
  }

  // DELETE /entity-edge/{uuid} - Delete relationship/fact
  async deleteEntityEdge(uuid: string, groupId = DEFAULT_GROUP_ID): Promise<void> {
    await this.fetch(`/entity-edge/${uuid}?group_id=${groupId}`, {
      method: "DELETE",
    });

    toast.success("Fact deleted");
  }

  // PATCH /entity-edge/{uuid} - Update fact text
  // Note: This endpoint needs to be added to the graphiti-server
  async updateFact(uuid: string, fact: string, groupId = DEFAULT_GROUP_ID): Promise<void> {
    await this.fetch(`/entity-edge/${uuid}`, {
      method: "PATCH",
      body: JSON.stringify({ fact, group_id: groupId }),
    });

    toast.success("Fact updated");
  }

  // POST /entity-node - Update entity name or summary (uses same endpoint as create)
  async updateEntity(
    uuid: string,
    updates: { name?: string; summary?: string },
    groupId = DEFAULT_GROUP_ID
  ): Promise<Entity> {
    // First fetch the current entity to get all properties
    const currentEntity = await this.getEntity(uuid, groupId);

    // Send POST to /entity-node with updated values (idempotent save)
    await this.fetch("/entity-node", {
      method: "POST",
      body: JSON.stringify({
        uuid,
        group_id: groupId,
        name: updates.name ?? currentEntity.name,
        summary: updates.summary ?? currentEntity.summary,
      }),
    });

    toast.success("Entity updated");

    // Fetch and return the updated entity
    return this.getEntity(uuid, groupId);
  }

  // GET /entity-edge/{uuid} - Get entity edge details
  async getEntityEdge(uuid: string, groupId: string = DEFAULT_GROUP_ID): Promise<EntityEdge> {
    return this.fetch<EntityEdge>(`/entity-edge/${uuid}?group_id=${groupId}`);
  }

  // GET /entity-edge/{uuid}?include_entities=true&include_episodes=true - Get fact details with provenance
  async getFactDetails(
    uuid: string,
    groupId: string = DEFAULT_GROUP_ID,
    includeEntities = true,
    includeEpisodes = true
  ): Promise<Fact> {
    const params = new URLSearchParams({
      group_id: groupId,
      include_entities: includeEntities.toString(),
      include_episodes: includeEpisodes.toString(),
    });
    return this.fetch<Fact>(`/entity-edge/${uuid}?${params.toString()}`);
  }

  // GET /entity-edge/{uuid}/related-facts - Get fact provenance and lifecycle
  async getRelatedFacts(
    uuid: string,
    groupId: string = DEFAULT_GROUP_ID
  ): Promise<{
    superseded_by: Fact[];
    supersedes: Fact[];
    related: Fact[];
  }> {
    const params = new URLSearchParams({ group_id: groupId });
    return this.fetch<{
      superseded_by: Fact[];
      supersedes: Fact[];
      related: Fact[];
    }>(`/entity-edge/${uuid}/related-facts?${params.toString()}`);
  }

  // GET /healthcheck - Server status
  async healthcheck(): Promise<HealthCheckResponse> {
    return this.fetch<HealthCheckResponse>("/healthcheck");
  }

  // GET /entities/{group_id}/{uuid} - Get single entity by UUID
  async getEntity(uuid: string, groupId = DEFAULT_GROUP_ID): Promise<Entity> {
    return this.fetch<Entity>(`/entities/${groupId}/${uuid}`);
  }

  // GET /entities/{group_id} - List entities with pagination, filtering, and sorting
  async listEntities(
    groupId = DEFAULT_GROUP_ID,
    limit = 50,
    cursor?: string,
    sortBy: 'uuid' | 'name' | 'created_at' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    nameFilter?: string,
    label?: string,
    createdAfter?: string,
    createdBefore?: string,
    withEmbeddings = false
  ): Promise<EntityListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
      with_embeddings: withEmbeddings.toString(),
    });

    if (cursor) {
      params.append("cursor", cursor);
    }
    if (nameFilter) {
      params.append("name_filter", nameFilter);
    }
    if (label) {
      params.append("label", label);
    }
    if (createdAfter) {
      params.append("created_after", createdAfter);
    }
    if (createdBefore) {
      params.append("created_before", createdBefore);
    }

    return this.fetch<EntityListResponse>(`/entities/${groupId}?${params.toString()}`);
  }

  // POST /entities/by-uuids - Batch get entities by UUIDs
  async getEntitiesByUuids(uuids: string[]): Promise<EntityListResponse> {
    return this.fetch<EntityListResponse>("/entities/by-uuids", {
      method: "POST",
      body: JSON.stringify(uuids),
    });
  }

  // GET /entities/{group_id}/{uuid}/relationships - Get related entities
  async getEntityRelationships(uuid: string, groupId = DEFAULT_GROUP_ID): Promise<EntityListResponse> {
    return this.fetch<EntityListResponse>(`/entities/${groupId}/${uuid}/relationships`);
  }

  // GET /entities/{group_id}/{uuid}/facts - Get facts structurally connected to entity
  async getEntityFacts(
    uuid: string,
    groupId = DEFAULT_GROUP_ID,
    limit = 50
  ): Promise<SearchResponse> {
    return this.fetch<SearchResponse>(`/entities/${groupId}/${uuid}/facts?limit=${limit}`);
  }

  // GET /sessions/{group_id} - List sessions with pagination
  async listSessions(
    groupId = DEFAULT_GROUP_ID,
    limit = 50,
    cursor?: string,
    search?: string,
    projectName?: string,
    createdAfter?: string,
    createdBefore?: string,
    validAfter?: string,
    validBefore?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<SessionListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort_order: sortOrder,
    });

    if (cursor) params.append("cursor", cursor);
    if (search) params.append("search", search);
    if (projectName) params.append("project_name", projectName);
    if (createdAfter) params.append("created_after", createdAfter);
    if (createdBefore) params.append("created_before", createdBefore);
    if (validAfter) params.append("valid_after", validAfter);
    if (validBefore) params.append("valid_before", validBefore);

    return this.fetch<SessionListResponse>(`/sessions/${groupId}?${params.toString()}`);
  }

  // GET /episodes/{group_id} - List episodes with pagination (future API enhancement)
  // NOTE: This method is prepared for when the backend API is updated to support pagination
  // Current API only supports last_n parameter, use getEpisodes() for now
  async listEpisodes(
    groupId = DEFAULT_GROUP_ID,
    limit = 50,
    cursor?: string,
    sortBy: 'created_at' | 'valid_at' = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    startDate?: string,
    endDate?: string,
    sessionId?: string
  ): Promise<EpisodeListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder,
    });

    if (cursor) params.append("cursor", cursor);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (sessionId) params.append("session_id", sessionId);

    return this.fetch<EpisodeListResponse>(`/episodes/${groupId}?${params.toString()}`);
  }

  // GET /sessions/{group_id}/stats/by-day - Session counts per day
  async getSessionStatsByDay(
    groupId = DEFAULT_GROUP_ID,
    createdAfter?: string,
    createdBefore?: string,
    validAfter?: string,
    validBefore?: string
  ): Promise<SessionStatsByDay> {
    const params = new URLSearchParams();

    if (createdAfter) params.append("created_after", createdAfter);
    if (createdBefore) params.append("created_before", createdBefore);
    if (validAfter) params.append("valid_after", validAfter);
    if (validBefore) params.append("valid_before", validBefore);

    const queryString = params.toString();
    const url = queryString
      ? `/sessions/${groupId}/stats/by-day?${queryString}`
      : `/sessions/${groupId}/stats/by-day`;

    return this.fetch<SessionStatsByDay>(url);
  }

  // GET /sessions/{group_id}/{session_id} - Get session details with episodes
  async getSession(
    sessionId: string,
    groupId = DEFAULT_GROUP_ID
  ): Promise<SessionDetailResponse> {
    return this.fetch<SessionDetailResponse>(`/sessions/${groupId}/${sessionId}`);
  }

  // GET /projects/{group_id} - List projects with pagination
  async listProjects(
    groupId = DEFAULT_GROUP_ID,
    limit = 50,
    cursor?: string,
    nameFilter?: string,
    minEpisodes?: number,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<ProjectListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sort_order: sortOrder,
    });

    if (cursor) params.append("cursor", cursor);
    if (nameFilter) params.append("name_filter", nameFilter);
    if (minEpisodes !== undefined) params.append("min_episodes", minEpisodes.toString());

    return this.fetch<ProjectListResponse>(`/projects/${groupId}?${params.toString()}`);
  }

  // GET /projects/{group_id}/{project_name}/episodes - Get episodes for a project
  async getProjectEpisodes(
    groupId = DEFAULT_GROUP_ID,
    projectName: string,
    limit = 50,
    cursor?: string
  ): Promise<{ episodes: Episode[]; has_more: boolean; cursor: string | null }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) params.append("cursor", cursor);

    // URL-encode the project name for the path
    const encodedProjectName = encodeURIComponent(projectName);
    return this.fetch<{ episodes: Episode[]; has_more: boolean; cursor: string | null }>(
      `/projects/${groupId}/${encodedProjectName}/episodes?${params.toString()}`
    );
  }

  // GET /projects/{group_id}/{project_name}/sessions - Get sessions for a project
  async getProjectSessions(
    groupId = DEFAULT_GROUP_ID,
    projectName: string,
    limit = 50,
    cursor?: string
  ): Promise<SessionListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) params.append("cursor", cursor);

    // URL-encode the project name for the path
    const encodedProjectName = encodeURIComponent(projectName);
    return this.fetch<SessionListResponse>(
      `/projects/${groupId}/${encodedProjectName}/sessions?${params.toString()}`
    );
  }

  // GET /projects/{group_id}/{project_name}/entities - Get entities mentioned in project
  async getProjectEntities(
    groupId = DEFAULT_GROUP_ID,
    projectName: string,
    limit = 50,
    cursor?: string
  ): Promise<EntityListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    if (cursor) params.append("cursor", cursor);

    // URL-encode the project name for the path
    const encodedProjectName = encodeURIComponent(projectName);
    return this.fetch<EntityListResponse>(
      `/projects/${groupId}/${encodedProjectName}/entities?${params.toString()}`
    );
  }

  // GET /projects/{group_id}/stats/by-day - Daily activity stats for a project
  async getProjectStatsByDay(
    groupId = DEFAULT_GROUP_ID,
    projectName: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProjectStatsByDay> {
    const params = new URLSearchParams({
      project_name: projectName,
    });

    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    return this.fetch<ProjectStatsByDay>(
      `/projects/${groupId}/stats/by-day?${params.toString()}`
    );
  }

  // Generic graph navigation endpoints (thin layer over FalkorDB)

  // GET /graph/nodes/{uuid} - Get any node by UUID with auto-detected type
  async getGraphNode(uuid: string, groupId = DEFAULT_GROUP_ID): Promise<GraphNode> {
    return this.fetch<GraphNode>(`/graph/nodes/${uuid}?group_id=${groupId}`);
  }

  // GET /graph/nodes/{uuid}/connections - Get all connections for a node
  async getNodeConnections(
    uuid: string,
    groupId = DEFAULT_GROUP_ID
  ): Promise<NodeConnectionsResponse> {
    return this.fetch<NodeConnectionsResponse>(
      `/graph/nodes/${uuid}/connections?group_id=${groupId}`
    );
  }

  // GET /graph/edges/{uuid} - Get any edge by UUID
  async getGraphEdge(uuid: string, groupId = DEFAULT_GROUP_ID): Promise<GraphEdge> {
    return this.fetch<GraphEdge>(`/graph/edges/${uuid}?group_id=${groupId}`);
  }

  // GET /graph/edges/{uuid}/connections - Get source and target nodes for an edge
  async getEdgeConnections(
    uuid: string,
    groupId = DEFAULT_GROUP_ID
  ): Promise<EdgeConnectionsResponse> {
    return this.fetch<EdgeConnectionsResponse>(
      `/graph/edges/${uuid}/connections?group_id=${groupId}`
    );
  }

  // Graph (group) management endpoints

  // GET /groups - List all available graphs
  async listGroups(): Promise<GroupsListResponse> {
    return this.fetch<GroupsListResponse>("/groups");
  }

  // DELETE /group/{group_id} - Delete a graph and all its data
  async deleteGroup(groupId: string): Promise<DeleteGroupResponse> {
    return this.fetch<DeleteGroupResponse>(`/group/${groupId}`, {
      method: "DELETE",
    });
  }

  // POST /group/{group_id}/backup - Create a backup of a graph
  async backupGroup(sourceGroupId: string, targetGroupId: string): Promise<BackupGroupResponse> {
    const response = await this.fetch<BackupGroupResponse>(
      `/group/${sourceGroupId}/backup?target_group_id=${encodeURIComponent(targetGroupId)}`,
      {
        method: "POST",
      }
    );

    toast.success(`Backup created: ${targetGroupId}`);
    return response;
  }
}

// Export singleton instance
export const graphitiService = new GraphitiService();
export default graphitiService;
