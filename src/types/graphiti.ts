// Episode - raw interaction data
export interface Episode {
  uuid: string;
  name: string;
  content: string;
  source_description: string;
  session_id: string;
  project_name?: string; // Optional project name (null maps to "_general")
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
  // Provenance fields (optional, only included when requested via include_entities/include_episodes)
  source_node_uuid?: string; // UUID of source entity in relationship
  target_node_uuid?: string; // UUID of target entity in relationship
  source_entity?: Entity; // Full details of source entity
  target_entity?: Entity; // Full details of target entity
  entities?: Entity[]; // Optional - not always returned by API (legacy field)
  episodes?: Episode[]; // Optional - episodes that created/mentioned this fact
}

// API request/response types
export interface SearchRequest {
  query: string;
  group_id: string;
  max_facts?: number;
  center_node_uuid?: string;
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
  uuid: string; // Session UUID from database (for consistent graph navigation)
  episode_count: number;
  first_episode_date: string;
  last_episode_date: string;
  source_descriptions: string[];
  summary?: string; // Optional AI-generated summary of the session
  project_name?: string; // Optional project name for the session
  first_episode_preview?: string; // Optional preview of the first episode content
  programmatic?: boolean; // Optional flag indicating if session was created programmatically
}

// Response from /sessions/{group_id}
export interface SessionListResponse {
  sessions: Session[];
  total: number;
  has_more: boolean;
  cursor: string | null;
}

// Response from /episodes/{group_id} (future paginated version)
export interface EpisodeListResponse {
  episodes: Episode[];
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
  uuid: string; // Project node UUID in graph database
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
  uuid: string; // Session UUID from database (for consistent graph navigation)
  summary?: string;
  episode_count: number;
  first_episode_date: string;
  last_episode_date: string;
  source_descriptions: string[];
  episodes: Episode[];
  project_name?: string; // Optional project name for the session
  first_episode_preview?: string; // Optional preview of the first episode content
  programmatic?: boolean; // Optional flag indicating if session was created programmatically
}

// Generic graph navigation types (thin layer over FalkorDB)

// Generic graph node (any node type: Entity, Episodic, Session, Project, Community)
// Note: "Fact" is a virtual node type used for edge visualization in GraphNavigator
export interface GraphNode {
  uuid: string;
  node_type: "Entity" | "Episodic" | "Session" | "Project" | "Community" | "Fact";
  label: string; // Display name
  labels: string[]; // All node labels (e.g., ["Person", "Entity"])
  metadata: Record<string, any>; // All node properties
  created_at: string | null;
}

// Generic graph edge (any relationship type: RELATES_TO, MENTIONS, etc.)
export interface GraphEdge {
  uuid: string;
  edge_type: "RELATES_TO" | "MENTIONS" | "HAS_MEMBER" | "IN_PROJECT" | "PART_OF_PROJECT";
  label: string; // Display name/fact
  source_uuid: string;
  target_uuid: string;
  metadata: Record<string, any>; // All edge properties
  created_at: string | null;
}

// Connection between nodes (node + relationship + direction)
export interface GraphConnection {
  node: GraphNode;
  relationship: GraphEdge;
  direction: "incoming" | "outgoing";
}

// Response from GET /graph/nodes/{uuid}/connections
export interface NodeConnectionsResponse {
  center_node: GraphNode;
  connections: GraphConnection[];
  total_connections: number;
}

// Response from GET /graph/edges/{uuid}/connections
export interface EdgeConnectionsResponse {
  edge: GraphEdge;
  source: GraphNode;
  target: GraphNode;
}

// Source - metadata about content origin
export interface SourceInfo {
  name: string; // e.g., "meeting-notes.md", "Manual Entry"
  type: "file" | "text" | "session" | "meeting"; // Extensible source types
  metadata: Record<string, any>; // Additional metadata (filename, file_size, etc.)
}

// Request for adding content with source tracking
export interface AddContentRequest {
  group_id: string;
  content: string; // Raw content to be processed
  project_name: string | null; // Optional project (null → "_general")
  source_name: string;
  source_type: string;
  source_metadata: Record<string, any>;
}

// Response from POST /content
export interface AddContentResponse {
  source_uuid: string;
  message: string;
  success: boolean;
}

// Response from GET /sources/{group_id}/{source_uuid}/extraction-results
export interface SourceExtractionResultsResponse {
  source: Entity; // Source entity with metadata
  episodes: Episode[];
  facts: Fact[];
  entities: Entity[];
  processing_complete: boolean;
}

// Group (Graph) management types

// Group info with stats
export interface GroupInfo {
  group_id: string;
  entity_count: number;
  episode_count: number;
  fact_count: number;
}

// Response from GET /groups
export interface GroupsListResponse {
  groups: GroupInfo[];
  total: number;
}

// Response from DELETE /group/{group_id}
export interface DeleteGroupResponse {
  message: string;
  success: boolean;
}

// Response from POST /group/{source_group_id}/backup
export interface BackupGroupResponse {
  message: string;
  success: boolean;
  stats: {
    entities: number;
    episodes: number;
    facts: number;
    total: number;
  };
}
