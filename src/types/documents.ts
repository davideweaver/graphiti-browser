export interface ObsidianDocument {
  path: string; // "Projects/Feature.md"
  frontmatter: Record<string, any>;
  created: string; // ISO timestamp
  modified: string; // ISO timestamp
}

export interface DocumentListResponse {
  documents: ObsidianDocument[];
  folders?: string[]; // Only present when recursive=false
  total: number;
  hasMore: boolean;
}

export interface DocumentViewResponse {
  path: string;
  absolutePath: string; // Absolute filesystem path on the server
  content: string; // Markdown content
  frontmatter: Record<string, any>;
  created: string;
  modified: string;
  totalLines?: number;
}

export interface FolderItem {
  name: string; // "Projects"
  path: string; // "Projects"
  type: "folder";
  documentCount?: number;
}

export interface DocumentItem {
  name: string; // "Feature.md"
  path: string; // "Projects/Feature.md"
  type: "document";
  modified: string;
}

export type NavigationItem = FolderItem | DocumentItem;

export interface SearchResult {
  filePath: string;
  fileName: string;
  heading: string;
  content: string;
  similarity: number;
  hybridScore?: number;
  filenameScore?: number;
  semanticScore?: number;
  metadata?: {
    startLine?: number;
    endLine?: number;
    chunkIndex?: number;
  };
}

export interface DocumentSearchResponse {
  results: SearchResult[];
  count: number;
}

export interface DocumentSearchRequest {
  query: string;
  limit?: number;
}

export interface Bookmark {
  path: string;
  created: string; // ISO timestamp
  tags: string[];
  note: string;
}

export interface BookmarkListResponse {
  bookmarks: Bookmark[];
  total: number;
}

export interface BookmarkRequest {
  path: string;
  tags?: string[];
  note?: string;
}

export interface BookmarkDeleteResponse {
  success: boolean;
  existed: boolean;
}
