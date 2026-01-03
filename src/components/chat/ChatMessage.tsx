import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MemoryBadge from "./MemoryBadge";
import type { ChatMessage } from "@/types/chat";
import { User, Bot, Loader2 } from "lucide-react";

interface Props {
  message: ChatMessage;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) return null; // Don't render system messages

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-1 ${isUser ? "items-end" : "items-start"}`}
      >
        {/* Memory badge (only for assistant messages with memories) */}
        {!isUser &&
          message.memoryFactIds &&
          message.memoryFactIds.length > 0 && (
            <MemoryBadge
              factIds={message.memoryFactIds}
              facts={message.memoryFacts}
            />
          )}

        {/* Message card */}
        <Card
          className={`p-3 ${isUser ? "bg-primary text-primary-foreground" : ""}`}
        >
          <div className="flex items-start gap-2">
            {!isUser && <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />}
            {isUser && <User className="h-5 w-5 mt-0.5 flex-shrink-0" />}

            <div className="flex-1 min-w-0">
              <div
                className={`prose prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${
                  isUser
                    ? "prose-invert [&_*]:text-white"
                    : "dark:prose-invert"
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>

              {message.isStreaming && (
                <div className="flex items-center gap-1 mt-2 text-xs opacity-70">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Typing...
                </div>
              )}

              {message.error && (
                <div className="mt-2 text-xs text-destructive">
                  Error: {message.error}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground px-2">
          {format(new Date(message.timestamp), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
