import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGraphiti } from "@/context/GraphitiContext";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { llamacppService } from "@/api/llamacppService";
import { graphitiService } from "@/api/graphitiService";
import Container from "@/layout/Container";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ConnectionStatus from "@/components/chat/ConnectionStatus";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { estimateTokens } from "@/hooks/use-token-counter";

const SYSTEM_PROMPT = `You are a helpful assistant with access to the user's personal knowledge graph.
Use the facts provided in the context to give personalized, accurate responses.
If the context doesn't contain relevant information, you can still help based on your general knowledge.`;

export default function Chat() {
  const { groupId } = useGraphiti();
  const { messages, addMessage, updateMessage, clearHistory } =
    useChatHistory(groupId);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const { scrollRef, handleScroll, scrollToBottom } = useAutoScroll(
    messages.length + isStreaming
  );

  // Health check
  const { data: isOnline } = useQuery({
    queryKey: ["llamacpp-health"],
    queryFn: () => llamacppService.healthcheck(),
    refetchInterval: 10000,
  });

  // Send message handler
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    if (!isOnline) {
      toast.error("Chat server is offline");
      return;
    }

    const userMessage = input.trim();
    setInput("");

    // Scroll to bottom when user sends a message
    scrollToBottom();

    try {
      // 1. Add user message
      addMessage({
        role: "user",
        content: userMessage,
      });

      // 2. Search Graphiti for relevant facts
      setIsStreaming(true);
      const searchResults = await graphitiService
        .search(userMessage, groupId, 10)
        .catch(() => ({ facts: [] }));

      // 3. Format memory context
      let memoryContext = "";
      const memoryFactIds: string[] = [];
      const memoryFacts: Array<{ uuid: string; fact: string; valid_at: string }> = [];

      if (searchResults.facts.length > 0) {
        const selectedFacts = searchResults.facts.slice(0, 5);

        const factList = selectedFacts
          .map(
            (f, i) =>
              `<fact id="${i + 1}" timestamp="${f.valid_at}">\n${f.fact}\n</fact>`
          )
          .join("\n\n");

        memoryContext = `<graphiti_context>\nBased on your query, here are relevant facts:\n\n${factList}\n</graphiti_context>\n\n`;
        memoryFactIds.push(...selectedFacts.map((f) => f.uuid));
        memoryFacts.push(...selectedFacts.map((f) => ({
          uuid: f.uuid,
          fact: f.fact,
          valid_at: f.valid_at,
        })));
      }

      // 4. Build message history for LLM
      const systemMessage = {
        role: "system",
        content: memoryContext + SYSTEM_PROMPT,
      };

      const conversationMessages = messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const llmMessages = [
        systemMessage,
        ...conversationMessages,
        { role: "user", content: userMessage },
      ];

      // 5. Stream response from LlamaCpp
      let assistantContent = "";
      const assistantMsg = addMessage({
        role: "assistant",
        content: "",
        memoryFactIds: memoryFactIds.length > 0 ? memoryFactIds : undefined,
        memoryFacts: memoryFacts.length > 0 ? memoryFacts : undefined,
        isStreaming: true,
      });

      await llamacppService.sendMessageStream(
        llmMessages,
        (chunk) => {
          assistantContent += chunk;
          updateMessage(assistantMsg.id, {
            content: assistantContent,
            tokenEstimate: estimateTokens(assistantContent),
          });
        },
        () => {
          updateMessage(assistantMsg.id, { isStreaming: false });
          setIsStreaming(false);
        },
        (error) => {
          updateMessage(assistantMsg.id, {
            error: error.message,
            isStreaming: false,
          });
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error("Chat error:", error);
      setIsStreaming(false);
      toast.error("Failed to send message");
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear chat history? This cannot be undone.")) {
      clearHistory();
      toast.success("Chat history cleared");
    }
  };

  return (
    <Container
      title="Chat with Graphiti Memory"
      description="Powered by llamacpp with Graphiti memory injection"
      content="fixed"
      tools={
        <>
          <ConnectionStatus isOnline={isOnline ?? false} />
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </>
      }
    >
      <div className="flex flex-col h-full">
        {/* Messages */}
        <ScrollArea
          ref={scrollRef}
          className="flex-1 p-4"
          onScrollCapture={handleScroll}
        >
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg font-semibold mb-2">Start a conversation</p>
              <p className="text-sm">
                Your messages will be enhanced with relevant facts from Graphiti
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
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
