import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGraphiti } from '@/context/GraphitiContext';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useBackendChat } from '@/hooks/use-backend-chat';
import Container from '@/components/container/Container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ConnectionStatus from '@/components/chat/ConnectionStatus';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001';
const MODEL_STORAGE_KEY = 'graphiti-chat-selected-model';
const AGENT_STORAGE_KEY = 'graphiti-chat-selected-agent';
const CONTEXT_WINDOW_STORAGE_KEY = 'graphiti-chat-context-window';

export default function Chat() {
  const { groupId } = useGraphiti();
  const { messages, addMessage, updateMessage, clearHistory } = useChatHistory(groupId);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    // Migrate old "gpt-oss" key to "gpt-oss-q4"
    if (stored === 'gpt-oss') {
      return 'gpt-oss-q4';
    }
    return stored || 'qwen';
  });
  const [selectedAgent, setSelectedAgent] = useState(() => {
    return localStorage.getItem(AGENT_STORAGE_KEY) || 'react';
  });
  const [contextWindow, setContextWindow] = useState(() => {
    const stored = localStorage.getItem(CONTEXT_WINDOW_STORAGE_KEY);
    return stored ? Number(stored) : 1;
  });
  const { scrollRef, handleScroll, scrollToBottom } = useAutoScroll(messages.length);

  // Persist model selection to localStorage
  useEffect(() => {
    localStorage.setItem(MODEL_STORAGE_KEY, selectedModel);
  }, [selectedModel]);

  // Persist agent selection to localStorage
  useEffect(() => {
    localStorage.setItem(AGENT_STORAGE_KEY, selectedAgent);
  }, [selectedAgent]);

  // Persist context window to localStorage
  useEffect(() => {
    localStorage.setItem(CONTEXT_WINDOW_STORAGE_KEY, contextWindow.toString());
  }, [contextWindow]);

  // Health check for backend service
  const { data: isOnline } = useQuery({
    queryKey: ['chat-backend-health'],
    queryFn: async () => {
      try {
        const response = await fetch(`${CHAT_API_URL}/health`, {
          signal: AbortSignal.timeout(5000),
        });
        return response.ok;
      } catch {
        return false;
      }
    },
    refetchInterval: 10000,
  });

  // Backend chat hook
  const { sendMessage, isStreaming } = useBackendChat({
    onAddMessage: addMessage,
    onUpdateMessage: updateMessage,
    groupId,
  });

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    if (!isOnline) {
      toast.error(`Chat backend offline. Check ${CHAT_API_URL}`);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    scrollToBottom();

    addMessage({ role: 'user', content: userMessage });
    await sendMessage(userMessage, messages, selectedModel, selectedAgent, contextWindow);
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat history?')) {
      clearHistory();
      toast.success('Chat history cleared');
    }
  };

  const handleRepeatMessage = (content: string) => {
    setInput(content);
    scrollToBottom();
  };

  return (
    <Container
      title="Chat with Graphiti Memory"
      description="Powered by backend chat service with ToolLoopAgent + CodeMode (Two-LLM pattern)"
      content="fixed"
      tools={
        <>
          <ConnectionStatus isOnline={isOnline ?? false} />
          <Button variant="destructive" size="sm" onClick={handleClearHistory} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </>
      }
    >
      <div className="flex flex-col h-full">
        <ScrollArea ref={scrollRef} className="flex-1 p-4" onScrollCapture={handleScroll}>
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg font-semibold mb-2">Start a conversation</p>
              <p className="text-sm">
                The agent can search your Graphiti memory, browse entities, and execute code
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg, idx) => {
              // Find the previous user message for assistant messages with traces
              let previousUserMessage: string | undefined;
              if (msg.role === 'assistant' && msg.trace) {
                for (let i = idx - 1; i >= 0; i--) {
                  if (messages[i].role === 'user') {
                    previousUserMessage = messages[i].content;
                    break;
                  }
                }
              }

              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  userMessage={previousUserMessage}
                  onRepeat={handleRepeatMessage}
                />
              );
            })}
          </div>
        </ScrollArea>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={!isOnline}
          isStreaming={isStreaming}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          selectedAgent={selectedAgent}
          onAgentChange={setSelectedAgent}
          contextWindow={contextWindow}
          onContextWindowChange={setContextWindow}
        />
      </div>
    </Container>
  );
}
