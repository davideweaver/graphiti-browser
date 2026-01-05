import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGraphiti } from '@/context/GraphitiContext';
import { useChatHistory } from '@/hooks/use-chat-history';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useBackendChat } from '@/hooks/use-backend-chat';
import Container from '@/layout/Container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import ConnectionStatus from '@/components/chat/ConnectionStatus';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001';

export default function Chat() {
  const { groupId } = useGraphiti();
  const { messages, addMessage, updateMessage, clearHistory } = useChatHistory(groupId);
  const [input, setInput] = useState('');
  const { scrollRef, handleScroll, scrollToBottom } = useAutoScroll(messages.length);

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
    await sendMessage(userMessage, messages);
  };

  const handleClearHistory = () => {
    if (confirm('Clear chat history?')) {
      clearHistory();
      toast.success('Chat history cleared');
    }
  };

  return (
    <Container
      title="Chat with Graphiti Memory"
      description="Powered by backend chat service with ToolLoopAgent + CodeMode (Two-LLM pattern)"
      content="fixed"
      tools={
        <>
          <ConnectionStatus isOnline={isOnline ?? false} />
          <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={messages.length === 0}>
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
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={!isOnline}
          isStreaming={isStreaming}
        />
      </div>
    </Container>
  );
}
