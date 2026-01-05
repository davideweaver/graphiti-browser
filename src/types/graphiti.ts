// Episode - raw interaction data
export interface Episode {
  uuid: string;
  name: string;
  content: string;
  source_description: string;
  session_id: string;
  timestamp: string;
  created_at: string;
  valid_at: string;
  group_id: string;
}

// Entity - extracted person/place/thing
export interface Entity {
  uuid: string;
  name: string;
  entity_type?: string; // "Person", "Organization", "Location", etc. (legacy - now in labels)
  labels: string[]; // Entity type labels like ["Person", "Entity"]
  summary: string;
  attributes: Record<string, any>; // Additional entity attributes
  group_id: string;
  created_at: string;
}

// Entity list response with pagination
export interface EntityListResponse {
  entities: Entity[];
  total: number;
  has_more: boolean;
  cursor: string | null;
}

// Relationship - edge between entities
export interface EntityEdge {
  uuid: string;
  source_node_uuid: string;
  target_node_uuid: string;
  name: string; // relationship type
  fact: string;
  valid_at: string;
  invalid_at?: string;
  created_at: string;
}

// Fact - searchable knowledge unit
export interface Fact {
  uuid: string;
  name: string;
  fact: string;
  valid_at: string;
  invalid_at?: string;
  created_at: string;
  expired_at?: string;
  similarity_score?: number; // Optional - similarity/reranker score (0.0-1.0)
  entities?: Entity[]; // Optional - not always returned by API
  episodes?: Episode[]; // Optional - not always returned by API
}

// API request/response types
export interface SearchRequest {
  query: string;
  group_id: string;
  max_facts?: number;
}

export interface SearchResponse {
  facts: Fact[];
}

export interface AddMessagesRequest {
  group_id: string;
  messages: Message[];
}

export interface Message {
  content: string;
  uuid?: string;
  name?: string;
  role_type: "user" | "assistant" | "system";
  role: string;
  timestamp: string;
  source_description?: string;
}

export interface GetEpisodesParams {
  group_id: string;
  last_n: number;
}

export interface CreateEntityRequest {
  uuid: string;
  group_id: string;
  name: string;
  summary?: string;
}

export interface HealthCheckResponse {
  status: string;
}

// Session - metadata for a group of related episodes
export interface Session {
  session_id: string;
  episode_count: number;
  first_episode_date: string;
  last_episode_date: string;
  source_descriptions: string[];
  summary?: string; // Optional AI-generated summary of the session
  project_name?: string; // Optional project name for the session
  first_episode_preview?: string; // Optional preview of the first episode content
}

// Response from /sessions/{group_id}
export interface SessionListResponse {
  sessions: Session[];
  total: number;
  has_more: boolean;
  cursor: string | null;
}

// Response from /sessions/{group_id}/stats/by-day
export interface SessionStatsByDay {
  stats: Array<{
    date: string;
    count: number;
  }>;
  total_days: number;
}

// Project - metadata about a named project
export interface Project {
  name: string;
  group_id: string;
  episode_count: number;
  session_count: number;
  first_episode_date: string;
  last_episode_date: string;
  project_path?: string; // Optional file system path for the project
}

// Response from GET /projects/{group_id}
export interface ProjectListResponse {
  projects: Project[];
  total: number;
  has_more: boolean;
  cursor: string | null;
}

// Response from GET /projects/{group_id}/stats/by-day
export interface ProjectStatsByDay {
  stats: Array<{
    date: string;
    count: number;
  }>;
  total_days: number;
}

// Response from GET /sessions/{group_id}/{session_id}
export interface SessionDetailResponse {
  session_id: string;
  summary?: string;
  episode_count: number;
  first_episode_date: string;
  last_episode_date: string;
  source_descriptions: string[];
  episodes: Episode[];
  project_name?: string; // Optional project name for the session
  first_episode_preview?: string; // Optional preview of the first episode content
}
