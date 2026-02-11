import { toast } from "@/hooks/use-toast";
import type {
  HealthResponse,
  SystemStatusResponse,
  ServerListResponse,
  ServerControlResponse,
  ModelListResponse,
  RouterStatus,
  RouterControlResponse,
  LogResponse,
  LogQueryParams,
} from "@/types/llamacppService";

class LlamacppAdminService {
  private baseUrl: string;
  private bearerToken: string;

  constructor() {
    // Use proxy path in development, direct URL in production
    this.baseUrl = import.meta.env.DEV
      ? "/llamacpp-admin"
      : (import.meta.env.VITE_LLAMACPP_ADMIN_URL || "");
    this.bearerToken = import.meta.env.VITE_LLAMACPP_ADMIN_TOKEN || "";

    console.log("LlamacppAdminService initialized:", {
      baseUrl: this.baseUrl,
      isDev: import.meta.env.DEV,
      hasToken: !!this.bearerToken,
      tokenPrefix: this.bearerToken ? `${this.bearerToken.substring(0, 10)}...` : "none"
    });

    if (!this.baseUrl && !import.meta.env.DEV) {
      console.warn(
        "VITE_LLAMACPP_ADMIN_URL not configured. LlamaCPP admin may not work."
      );
    }
    if (!this.bearerToken) {
      console.warn(
        "VITE_LLAMACPP_ADMIN_TOKEN not configured. Authentication will fail."
      );
    }
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.bearerToken}`,
    };
  }

  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch health: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch health status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getSystemStatus(): Promise<SystemStatusResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch system status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async listServers(): Promise<ServerListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/servers`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch servers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch servers";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async startServer(serverId: string): Promise<ServerControlResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/servers/${serverId}/start`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to start server: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Server started",
        description: result.message || `Server ${serverId} is starting`,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start server";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async stopServer(serverId: string): Promise<ServerControlResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/servers/${serverId}/stop`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to stop server: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Server stopped",
        description: result.message || `Server ${serverId} has been stopped`,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to stop server";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async restartServer(serverId: string): Promise<ServerControlResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/servers/${serverId}/restart`,
        {
          method: "POST",
          headers: this.getHeaders(),
        }
      );

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to restart server: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Server restarted",
        description: result.message || `Server ${serverId} is restarting`,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to restart server";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getServerLogs(
    serverId: string,
    params?: LogQueryParams
  ): Promise<LogResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.level) queryParams.append("level", params.level);
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.since) queryParams.append("since", params.since);

      const url = `${this.baseUrl}/api/servers/${serverId}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch server logs";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async listModels(): Promise<ModelListResponse> {
    try {
      const url = `${this.baseUrl}/api/models`;
      console.log("Fetching models from:", url);

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      console.log("Models response status:", response.status);

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Models API error:", errorText);
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Models API data:", data);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch models";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getRouterStatus(): Promise<RouterStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/router`, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch router status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch router status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async startRouter(): Promise<RouterControlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/router/start`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to start router: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Router started",
        description: result.message || "Router is starting",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start router";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async stopRouter(): Promise<RouterControlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/router/stop`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to stop router: ${response.statusText}`);
      }

      const result = await response.json();

      toast({
        title: "Router stopped",
        description: result.message || "Router has been stopped",
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to stop router";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }

  async getRouterLogs(params?: LogQueryParams): Promise<LogResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.level) queryParams.append("level", params.level);
      if (params?.limit) queryParams.append("limit", String(params.limit));
      if (params?.since) queryParams.append("since", params.since);

      const url = `${this.baseUrl}/api/router/logs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (response.status === 401) {
        throw new Error("Authentication required. Check VITE_LLAMACPP_ADMIN_TOKEN.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch router logs";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  }
}

export const llamacppAdminService = new LlamacppAdminService();
