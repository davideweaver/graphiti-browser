import type { Session } from "@/types/graphiti";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Calendar, FolderKanban, MessageSquare } from "lucide-react";

interface SessionCardProps {
  session: Session;
  onSessionClick?: (sessionId: string) => void;
}

export function SessionCard({ session, onSessionClick }: SessionCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSessionClick) {
      // Pass uuid for consistent graph navigation
      onSessionClick(session.uuid);
    } else {
      navigate(`/session/${session.session_id}`);
    }
  };

  const getSessionIcon = () => {
    if (session.project_name) {
      return <FolderKanban className="h-5 w-5 text-purple-500" />;
    }
    return <MessageSquare className="h-5 w-5 text-blue-500" />;
  };

  const getSessionBgColor = () => {
    if (session.project_name) {
      return "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20";
    }
    return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {getSessionIcon()}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">
                  {session.project_name || `Session ${session.session_id.slice(0, 8)}`}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {session.session_id}
                </p>
              </div>
              <Badge
                variant="secondary"
                className={getSessionBgColor()}
              >
                {session.episode_count} {session.episode_count === 1 ? 'episode' : 'episodes'}
              </Badge>
            </div>

            {/* Summary or first episode preview */}
            {(session.summary || session.first_episode_preview) && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {session.summary || session.first_episode_preview}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatDistanceToNow(new Date(session.last_episode_date), { addSuffix: true })}
                </span>
              </div>
              <span>•</span>
              <span>
                {format(new Date(session.first_episode_date), "MMM d, yyyy")}
                {session.first_episode_date !== session.last_episode_date && (
                  <> → {format(new Date(session.last_episode_date), "MMM d, yyyy")}</>
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
