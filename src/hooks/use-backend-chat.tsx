import { useState, useCallback } from 'react';
import type { ChatMessage } from '@/types/chat';
import { estimateTokens } from './use-token-counter';
import { toast } from 'sonner';

export interface UseBackendChatOptions {
  onAddMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'tokenEstimate'>) => ChatMessage;
  onUpdateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  groupId: string; // Group ID from context
}

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001';

/**
 * Hook for chat with backend graphiti-chat service
 */
export function useBackendChat({ onAddMessage, onUpdateMessage, groupId }: UseBackendChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (userMessage: string, conversationHistory: ChatMessage[]) => {
      setIsStreaming(true);

      try {
        // Build message history - only include last message as context
        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

        // Get last message from history (if exists)
        const lastMessage = conversationHistory
          .filter((m) => m.role !== 'system')
          .slice(-1)[0];

        if (lastMessage) {
          messages.push({
            role: lastMessage.role as 'user' | 'assistant',
            content: lastMessage.content,
          });
        }

        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        // Create assistant message placeholder
        const assistantMsg = onAddMessage({
          role: 'assistant',
          content: '',
          isStreaming: true,
        });

        console.log('🚀 Sending request to chat backend');
        console.log(`   Group ID: ${groupId}`);
        const startTime = Date.now();

        // Call backend API with groupId
        const response = await fetch(`${CHAT_API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, groupId }),
        });

        if (!response.ok) {
          throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(`✅ Response received in ${elapsed}s`);
        console.log(`   Success: ${data.success}`);
        console.log(`   Steps: ${data.steps}`);
        console.log(`   Memory facts: ${data.memoryFacts?.length || 0}`);
        console.log(`   Full trace:`, data);

        if (!data.success) {
          throw new Error(data.error || 'Backend request failed');
        }

        // Extract memory facts for badges
        const memoryFacts = data.memoryFacts || [];
        const memoryFactIds = memoryFacts.map((f: any) => f.uuid);

        // Update assistant message with response and full trace
        onUpdateMessage(assistantMsg.id, {
          content: data.response || 'No response generated.',
          tokenEstimate: estimateTokens(data.response || ''),
          memoryFactIds: memoryFactIds.length > 0 ? memoryFactIds : undefined,
          memoryFacts: memoryFacts.length > 0 ? memoryFacts : undefined,
          duration: data.duration,
          trace: data, // Store full trace payload
          isStreaming: false,
        });

        setIsStreaming(false);
      } catch (error) {
        console.error('Backend chat error:', error);
        toast.error(`Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsStreaming(false);
      }
    },
    [onAddMessage, onUpdateMessage, groupId]
  );

  return {
    sendMessage,
    isStreaming,
  };
}
