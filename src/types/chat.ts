// Chat-related TypeScript interfaces for llamacpp integration

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
