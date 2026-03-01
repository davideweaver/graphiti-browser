import { useState, useCallback } from 'react';
import type { ToolLoopAgent } from 'ai';
import type { ChatMessage } from '@/types/chat';
import { estimateTokens } from './use-token-counter';
import { toast } from 'sonner';

export interface UseAgentChatOptions {
  agent: ToolLoopAgent;
  onAddMessage: (message: Omit<ChatMessage, 'id' | 'timestamp' | 'tokenEstimate'>) => ChatMessage;
  onUpdateMessage: (id: string, updates: Partial<ChatMessage>) => void;
}

/**
 * Hook for chat with ToolLoopAgent (non-streaming)
 */
export function useAgentChat({ agent, onAddMessage, onUpdateMessage }: UseAgentChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = useCallback(
    async (userMessage: string, conversationHistory: ChatMessage[]) => {
      setIsStreaming(true);

      try {
        // Build message history (exclude system messages)
        const messages = conversationHistory
          .filter((m) => m.role !== 'system')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          }));

        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        // Create assistant message placeholder
        const assistantMsg = onAddMessage({
          role: 'assistant',
          content: '',
          isStreaming: true,
        });

        // Generate agent response (non-streaming)
        console.log('🚀 Starting agent generate with', messages.length, 'messages');
        const result = await agent.generate({ messages });

        console.log('✅ Agent generate completed');
        console.log('   Finish reason:', result.finishReason);
        console.log('   Steps:', result.steps?.length || 0);
        console.log('   Response text length:', result.text?.length || 0);

        // Extract memory facts from tool results
        const memoryFactIds: string[] = [];
        const memoryFacts: Array<{ uuid: string; fact: string; valid_at: string }> = [];

        if (result.steps) {
          for (const step of result.steps) {
            if (step.toolResults) {
              for (const toolResult of step.toolResults) {
                console.log('🔍 Processing tool result:', toolResult.toolName);

                // Cast to access result property (type definitions incomplete)
                const tr = toolResult as Record<string, unknown>;

                // Check for graphiti_search tool (direct pattern)
                if (tr.toolName === 'graphiti_search' && tr.result) {
                  try {
                    const parsed = typeof tr.result === 'string' ? JSON.parse(tr.result) : tr.result;
                    console.log('   Search result:', parsed);

                    // Direct tool returns: { facts: [...], count: N }
                    if (parsed?.facts && Array.isArray(parsed.facts)) {
                      const facts = parsed.facts;
                      console.log('   Found', facts.length, 'facts');

                      memoryFactIds.push(...facts.map((f: Record<string, unknown>) => f.uuid as string));
                      memoryFacts.push(
                        ...facts.map((f: Record<string, unknown>) => ({
                          uuid: f.uuid,
                          fact: f.fact,
                          valid_at: f.valid_at,
                        }))
                      );
                    }
                  } catch (e) {
                    console.error('   Failed to parse search result:', e);
                  }
                }
              }
            }
          }
        }

        // Update assistant message with final response
        onUpdateMessage(assistantMsg.id, {
          content: result.text || 'No response generated.',
          tokenEstimate: estimateTokens(result.text || ''),
          memoryFactIds: memoryFactIds.length > 0 ? [...new Set(memoryFactIds)] : undefined,
          memoryFacts: memoryFacts.length > 0 ? memoryFacts : undefined,
          isStreaming: false,
        });

        setIsStreaming(false);
      } catch (error) {
        console.error('Agent chat error:', error);
        toast.error(`Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsStreaming(false);
      }
    },
    [agent, onAddMessage, onUpdateMessage]
  );

  return {
    sendMessage,
    isStreaming,
  };
}
