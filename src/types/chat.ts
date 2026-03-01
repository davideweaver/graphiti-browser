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
  input: unknown;
  output: unknown;
  timestamp?: string;
  success?: boolean;
  error?: string;
}

export interface ToolDecision {
  toolName: string;
  toolCallId: string;
  input: unknown;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  output: unknown;
  error?: string;
  success: boolean;
}

export interface LLMTurn {
  turnNumber: number;
  reasoning: string;
  toolDecisions: ToolDecision[];
  toolResults: ToolExecutionResult[];
  timestamp?: string;
}

export interface AgentTrace {
  success: boolean;
  response: string;
  steps: number;
  duration: number;
  model?: string; // LLM model used (qwen, gpt-oss, mistral, etc.)
  agentType?: string; // Agent architecture used (react, codemode, etc.)
  finishReason?: string; // 'stop', 'tool-calls', etc.
  usedTools?: boolean;
  memoryFacts?: Array<{ uuid: string; fact: string; valid_at: string }>;
  error?: string;
  // Pre-search details
  preSearch?: PreSearchResult;
  // Tool usage details
  toolCalls?: ToolCall[];
  // LLM turn-by-turn reasoning trace
  llmTurns?: LLMTurn[];
  // Additional data
  reasoning?: string[];
  metadata?: Record<string, unknown>;
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
