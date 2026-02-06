export interface ScheduledTask {
  id: string;
  name: string;
  description?: string;
  schedule?: string; // Cron expression
  runAt?: string; // ISO datetime for one-time tasks
  task: string; // Module name (e.g., "run-agent")
  enabled: boolean;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskExecution {
  timestamp: string;
  success: boolean;
  durationMs: number;
  error?: string;
  message?: string;
  data?: Record<string, unknown>;
}

export interface ScheduledTaskListResponse {
  tasks: ScheduledTask[];
  count: number;
}
