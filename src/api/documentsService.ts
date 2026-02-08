import { toast } from "@/hooks/use-toast";
import type {
  DocumentListResponse,
  DocumentViewResponse,
  NavigationItem,
  FolderItem,
  DocumentItem,
  DocumentSearchResponse,
  DocumentSearchRequest,
} from "@/types/documents";

class DocumentsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      import.meta.env.VITE_XERRO_SERVICE_URL || "http://localhost:9205";
  }

  private async fetch<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Request failed: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle empty responses (e.g., successful DELETE operations)
      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        return undefined as T;
      }

      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async listDocuments(
    folder?: string,
    limit = 100,
    offset = 0
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams();
    if (folder) params.append("folder", folder);
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());

    return this.fetch<DocumentListResponse>(
      `/api/v1/obsidian/documents?${params}`
    );
  }

  async getDocument(path: string): Promise<DocumentViewResponse> {
    const params = new URLSearchParams({ path });
    return this.fetch<DocumentViewResponse>(
      `/api/v1/obsidian/documents/view?${params}`
    );
  }

  async getFolderStructure(folder?: string): Promise<NavigationItem[]> {
    // Fetch documents with high limit to get complete folder view
    const response = await this.listDocuments(folder, 500);

    // Extract immediate children from document paths
    const folderMap = new Map<string, number>(); // folder name -> document count
    const documentItems: DocumentItem[] = [];

    const currentPathSegments = folder ? folder.split("/").length : 0;

    for (const doc of response.documents) {
      const pathSegments = doc.path.split("/");

      // Extract the next segment after current folder
      if (pathSegments.length > currentPathSegments + 1) {
        // This is a nested item - extract folder
        const folderName = pathSegments[currentPathSegments];
        folderMap.set(folderName, (folderMap.get(folderName) || 0) + 1);
      } else if (pathSegments.length === currentPathSegments + 1) {
        // This is a direct child document
        const fileName = pathSegments[pathSegments.length - 1];
        documentItems.push({
          name: fileName,
          path: doc.path,
          type: "document",
          modified: doc.modified,
        });
      }
    }

    // Build folder items
    const folderItems: FolderItem[] = Array.from(folderMap.entries())
      .map(([name, count]) => ({
        name,
        path: folder ? `${folder}/${name}` : name,
        type: "folder" as const,
        documentCount: count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Sort documents by modified date (newest first)
    documentItems.sort(
      (a, b) =>
        new Date(b.modified).getTime() - new Date(a.modified).getTime()
    );

    // Return folders first, then documents
    return [...folderItems, ...documentItems];
  }

  async searchDocuments(
    query: string,
    limit = 20
  ): Promise<DocumentSearchResponse> {
    const body: DocumentSearchRequest = { query, limit };
    return this.fetch<DocumentSearchResponse>(
      "/api/v1/obsidian/search",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  }

  async deleteDocument(path: string): Promise<void> {
    const params = new URLSearchParams({ path });
    return this.fetch<void>(
      `/api/v1/obsidian/documents?${params}`,
      {
        method: "DELETE",
      }
    );
  }
}

export const documentsService = new DocumentsService();
