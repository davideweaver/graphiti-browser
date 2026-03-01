import { useState, useEffect, useCallback } from "react";
import type { ChatMessage, ChatHistory } from "@/types/chat";
import { estimateTokens } from "./use-token-counter";

const MAX_MESSAGES = 40; // 20 turns
const MAX_TOKENS = 12000;

function getStorageKey(groupId: string): string {
  return `graphiti-chat-${groupId}`;
}

export function useChatHistory(groupId: string) {
  // Initialize messages from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const key = getStorageKey(groupId);
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        const history: ChatHistory = JSON.parse(stored);
        if (history.version === "1.0" && history.groupId === groupId) {
          return history.messages;
        }
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
    return [];
  });

  // Save to localStorage on changes
  useEffect(() => {
    const key = getStorageKey(groupId);
    const history: ChatHistory = {
      version: "1.0",
      groupId,
      messages,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(history));
  }, [messages, groupId]);

  // Trim history to stay within limits
  const trimHistory = useCallback((msgs: ChatMessage[]): ChatMessage[] => {
    let trimmed = [...msgs];

    // Remove system messages (memory injections) from history
    trimmed = trimmed.filter((m) => m.role !== "system");

    // Enforce message count limit (sliding window)
    if (trimmed.length > MAX_MESSAGES) {
      trimmed = trimmed.slice(-MAX_MESSAGES);
    }

    // Enforce token limit (remove oldest until under limit)
    let totalTokens = trimmed.reduce((sum, m) => sum + m.tokenEstimate, 0);
    while (totalTokens > MAX_TOKENS && trimmed.length > 2) {
      const removed = trimmed.shift()!;
      totalTokens -= removed.tokenEstimate;
    }

    return trimmed;
  }, []);

  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp" | "tokenEstimate">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        tokenEstimate: estimateTokens(message.content),
      };

      setMessages((prev) => trimHistory([...prev, newMessage]));
      return newMessage;
    },
    [trimHistory]
  );

  const updateMessage = useCallback(
    (id: string, updates: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    updateMessage,
    clearHistory,
  };
}
