// Xerro Service Types
// Local system monitoring and service health

export interface SystemHealth {
  healthy: boolean;
  services: Record<string, {
    healthy: boolean;
    message?: string;
  }>;
  timestamp: string;
}

export interface Service {
  name: string;
  running: boolean;
}

export interface ServiceListResponse {
  services: Service[];
  count: number;
}

export interface LogEntry {
  time?: string;
  level?: string;
  msg?: string;
  service?: string;
  timestamp?: string;
  message?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LogQueryParams {
  service?: string;
  level?: string;
  limit?: number;
  since?: string; // ISO datetime
}

export interface LogResponse {
  logs: LogEntry[];
  total: number;
  limit: number;
  filtered: {
    service?: string;
    since?: string;
  };
}

export interface RestartServiceResponse {
  success: boolean;
  service: string;
  message: string;
  timestamp: string;
}
