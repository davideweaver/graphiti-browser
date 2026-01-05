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
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      // Handle empty responses (like DELETE)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      toast.error(`API Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  }

  // POST /search - Search for facts
  async search(
    query: string,
    groupId: string = DEFAULT_GROUP_ID,
    maxFacts = 10
  ): Promise<SearchResponse> {
    return this.fetch<SearchResponse>("/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        group_id: groupId,
        max_facts: maxFacts,
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

  // POST /entity-node - Create entity
  async createEntity(entity: CreateEntityRequest): Promise<Entity> {
    const response = await this.fetch<Entity>("/entity-node", {
      method: "POST",
      body: JSON.stringify(entity),
    });

    toast.success("Entity created");
    return response;
  }

  // DELETE /episode/{uuid} - Delete episode
  async deleteEpisode(uuid: string): Promise<void> {
    await this.fetch(`/episode/${uuid}`, {
      method: "DELETE",
    });

    toast.success("Episode deleted");
  }

  // DELETE /entity-edge/{uuid} - Delete relationship
  async deleteEntityEdge(uuid: string): Promise<void> {
    await this.fetch(`/entity-edge/${uuid}`, {
      method: "DELETE",
    });

    toast.success("Relationship deleted");
  }

  // GET /entity-edge/{uuid} - Get entity edge details
  async getEntityEdge(uuid: string): Promise<EntityEdge> {
    return this.fetch<EntityEdge>(`/entity-edge/${uuid}`);
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

  // GET /sessions/{group_id} - List sessions with pagination
  async listSessions(
    groupId = DEFAULT_GROUP_ID,
    limit = 50,
    cursor?: string,
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
    if (createdAfter) params.append("created_after", createdAfter);
    if (createdBefore) params.append("created_before", createdBefore);
    if (validAfter) params.append("valid_after", validAfter);
    if (validBefore) params.append("valid_before", validBefore);

    return this.fetch<SessionListResponse>(`/sessions/${groupId}?${params.toString()}`);
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
}

// Export singleton instance
export const graphitiService = new GraphitiService();
export default graphitiService;
