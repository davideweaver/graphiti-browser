// Chat-related TypeScript interfaces for llamacpp integration

export interface FactScore {
  uuid: string;
  fact: string;
  score: number;
  valid_at?: string;
}

export interface PreSearchResult {
  query: string;
  groupId: string;
  maxFacts: number;
  factsFound: number;
  timeMs: number;
  filteredFacts: FactScore[]; // Low-quality facts that were filtered out
  cleanedFacts: FactScore[]; // High-quality facts that were kept
}

export interface ToolCall {
  tool: string;
  input: any;
  output: any;
  timestamp?: string;
  success?: boolean;
  error?: string;
}

export interface AgentTrace {
  success: boolean;
  response: string;
  steps: number;
  duration: number;
  finishReason?: string; // 'stop', 'tool-calls', etc.
  usedTools?: boolean;
  memoryFacts?: Array<{ uuid: string; fact: string; valid_at: string }>;
  error?: string;
  // Pre-search details
  preSearch?: PreSearchResult;
  // Tool usage details
  toolCalls?: ToolCall[];
  // Additional data
  reasoning?: string[];
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tokenEstimate: number;
  memoryFactIds?: string[];
  memoryFacts?: Array<{ uuid: string; fact: string; valid_at: string }>;
  error?: string;
  isStreaming?: boolean;
  duration?: number; // Response duration in seconds
  trace?: AgentTrace; // Full trace payload from the agent
}

export interface ChatHistory {
  version: "1.0";
  groupId: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface LlamaCppRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  stream: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface LlamaCppStreamChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}
