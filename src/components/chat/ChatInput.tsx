import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  isStreaming = false,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const charCount = value.length;
  const maxChars = 2000;

  return (
    <div className="border-t p-4 space-y-2 bg-background">
      <Textarea
        placeholder="Type your message... (Shift+Enter for new line)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={3}
        className="resize-none"
      />

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {charCount} / {maxChars} chars
        </span>
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled || isStreaming}
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
}
