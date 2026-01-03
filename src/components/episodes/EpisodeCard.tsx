import { useState } from "react";
import type { Episode } from "@/types/graphiti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { parseEpisodeMessages } from "@/lib/utils";
import { ChatMessage } from "./ChatMessage";

interface EpisodeCardProps {
  episode: Episode;
  onDelete: (uuid: string) => void;
  isDeleting?: boolean;
}

function getContentPreview(content: string): string {
  // Try to parse messages and get first message content
  const messages = parseEpisodeMessages(content);
  if (messages.length > 0) {
    const firstMessage = messages[0].content;
    // Extract first 1-2 sentences (up to ~150 chars)
    const sentences = firstMessage.match(/[^.!?]+[.!?]+/g) || [];
    let preview = sentences.slice(0, 2).join(" ").trim();

    // If preview is too long or no sentences found, truncate
    if (!preview || preview.length === 0) {
      preview = firstMessage.substring(0, 150);
    } else if (preview.length > 150) {
      preview = preview.substring(0, 150);
    }

    return preview + (preview.length < firstMessage.length ? "..." : "");
  }

  // Fallback to original content
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  let preview = sentences.slice(0, 2).join(" ").trim();

  if (!preview || preview.length === 0) {
    preview = content.substring(0, 150);
  } else if (preview.length > 150) {
    preview = preview.substring(0, 150);
  }

  return preview + (preview.length < content.length ? "..." : "");
}

export function EpisodeCard({
  episode,
  onDelete,
  isDeleting = false,
}: EpisodeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const preview = getContentPreview(episode.content);
  const messages = parseEpisodeMessages(episode.content);

  return (
    <Card className="mb-3 cursor-pointer hover:bg-muted/50 transition-colors">
      <CardHeader
        className="pb-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-normal text-foreground line-clamp-2">
              {preview}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <span>
                {format(new Date(episode.created_at), "h:mm a")}
              </span>
              <span>•</span>
              <span>
                {isExpanded ? <ChevronUp className="h-3 w-3 inline" /> : <ChevronDown className="h-3 w-3 inline" />}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Episode?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this episode. This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(episode.uuid)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="max-h-[600px] overflow-y-auto px-2">
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                role={message.role}
                content={message.content}
                isUser={message.isUser}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
