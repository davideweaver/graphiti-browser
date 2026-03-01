// Llamacpp Admin Service Types
// Remote LLM server and model management

export interface HealthResponse {
  status: "healthy";
  uptime: number;
  timestamp: string;
}

export interface ServerInfo {
  id: string;
  modelName: string;
  modelPath: string;
  port: number;
  host: string;
  status: "running" | "stopped" | "crashed" | "starting" | "error";
  pid?: number;
  threads?: number;
  ctxSize?: number;
  gpuLayers?: number;
  verbose?: boolean;
  customFlags?: string[];
  label: string;
  alias?: string;
  plistPath: string;
  stdoutPath: string;
  stderrPath: string;
  lastStarted?: string;
  lastStopped?: string;
  createdAt: string;
  uptime?: number;
}

export interface ModelInfo {
  filename: string;
  path: string;
  size: number; // bytes
  formattedSize: string;
  serversUsing: number;
  serverIds: string[];
}

export interface RouterConfig {
  port: number;
  host: string;
  verbose: boolean;
  requestTimeout: number;
  healthCheckInterval: number;
  createdAt?: string;
  lastStarted?: string;
  lastStopped?: string;
  timeout?: number;
  retries?: number;
}

export interface RouterStatus {
  status: "running" | "stopped" | "not_configured" | "error";
  config: RouterConfig | null;
  pid?: number;
  isRunning: boolean;
  availableModels?: string[];
  createdAt?: string;
  lastStarted?: string;
  lastStopped?: string;
  error?: string;
  port?: number;
  uptime?: number;
  connectedServers?: number;
}

export interface SystemStatusResponse {
  servers: {
    total: number;
    running: number;
    stopped: number;
    crashed: number;
  };
  models: {
    total: number;
    totalSize: number;
  };
  system: {
    uptime: number;
    timestamp: string;
  };
}

export interface ServerListResponse {
  servers: ServerInfo[];
}

export interface ModelListResponse {
  models: ModelInfo[];
}

export interface ServerControlResponse {
  server: ServerInfo;
}

export interface RouterControlResponse {
  success: boolean;
  status: "running" | "stopped";
  pid?: number;
}

export interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LogResponse {
  stdout: string;
  stderr: string;
  logs?: LogEntry[];
}

export interface LogQueryParams {
  level?: string;
  limit?: number;
  since?: string;
}
