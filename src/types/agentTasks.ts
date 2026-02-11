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

export interface NormalizedTaskResult {
  /** Display layer - REQUIRED for UI rendering */
  display: {
    /** One-line summary for list views */
    summary: string;
    /** Full text/markdown for detail views */
    details?: string;
  };
  /** Metrics layer - OPTIONAL, only populated when applicable */
  metrics?: {
    /** AI cost in USD (run-agent only) */
    cost?: number;
    /** Execution time in ms (all tasks) */
    duration?: number;
    /** Items processed (task-dependent) */
    items?: number;
    /** Tokens used (AI tasks only) */
    tokens?: number;
  };
  /** Metadata layer - OPTIONAL, task-specific debugging info */
  metadata?: {
    /** AI session ID (run-agent only) */
    sessionId?: string;
    /** Tool invocations (AI tasks only) */
    toolCalls?: number;
    /** Task categorization */
    taskType?: string;
  };
}

export interface TaskExecution {
  timestamp: string;
  success: boolean;
  durationMs: number;
  error?: string;
  message?: string;
  data?: Record<string, unknown>;
  /** Normalized result in standard format for frontend consumption */
  normalizedResult?: NormalizedTaskResult;
}

export interface ScheduledTaskListResponse {
  tasks: ScheduledTask[];
  count: number;
}

/**
 * Properties for run-agent tasks
 * Based on xerro-service/src/tasks/run-agent.ts
 */
export interface RunAgentProperties {
  /** The prompt/task to execute (required) */
  prompt: string;
  /** Working directory for the agent (optional) */
  cwd?: string;
  /** Permission mode: 'allow_all' or custom allow list (optional) */
  permissions?: 'allow_all' | { allowList: string[] };
  /** Use local LLM server instead of Anthropic API (optional) */
  local?: boolean;
}
