import { useMemo } from "react";
import type { ChatMessage } from "@/types/chat";

const CHARS_PER_TOKEN = 4;
const MAX_CONVERSATION_TOKENS = 12000;
const MAX_MEMORY_TOKENS = 2000;
const SYSTEM_PROMPT_TOKENS = 500;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function useTokenCounter(messages: ChatMessage[]) {
  const totalTokens = useMemo(() => {
    return messages.reduce((sum, msg) => sum + msg.tokenEstimate, 0);
  }, [messages]);

  const conversationTokens = useMemo(() => {
    return messages
      .filter((m) => m.role !== "system")
      .reduce((sum, msg) => sum + msg.tokenEstimate, 0);
  }, [messages]);

  const isOverLimit = conversationTokens > MAX_CONVERSATION_TOKENS;
  const percentUsed = (conversationTokens / MAX_CONVERSATION_TOKENS) * 100;

  return {
    totalTokens,
    conversationTokens,
    isOverLimit,
    percentUsed,
    remaining: MAX_CONVERSATION_TOKENS - conversationTokens,
  };
}
