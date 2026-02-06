import { useNavigate } from "react-router-dom";
import { TimelineBar } from "./TimelineBar";
import { format, differenceInMinutes } from "date-fns";
import type { Session } from "@/types/graphiti";

interface SessionRowProps {
  session: Session;
  showProject?: boolean;
  onSessionClick?: (sessionId: string) => void;
}

export function SessionRow({
  session,
  showProject = true,
  onSessionClick
}: SessionRowProps) {
  const navigate = useNavigate();

  const minDate = new Date(session.first_episode_date);
  const maxDate = new Date(session.last_episode_date);
  const sameDay =
    format(minDate, "yyyy-MM-dd") ===
    format(maxDate, "yyyy-MM-dd");

  const timeRange = `${format(minDate, "h:mm a")} - ${format(maxDate, "h:mm a")}`;

  // Calculate duration
  const durationMins = differenceInMinutes(maxDate, minDate);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  // Check if session spans multiple days
  const isMultiDay = !sameDay;
  const dateInfo = isMultiDay
    ? `Started ${format(minDate, "MMM d")}`
    : null;

  const projectName = session.project_name || "Unknown Project";

  // Parse first episode preview to extract role and content
  let previewContent = null;
  if (session.first_episode_preview) {
    const match = session.first_episode_preview.match(/^\[(.+?)\]:\s*(.+)$/s);
    if (match) {
      const role = match[1].trim();
      const content = match[2].trim();
      previewContent = { role, content };
    }
  }

  const handleClick = () => {
    if (onSessionClick) {
      onSessionClick(session.session_id);
    } else {
      navigate(`/memory/sessions/${encodeURIComponent(session.session_id)}`);
    }
  };

  return (
    <div
      className="bg-background py-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          {showProject && (
            <h3 className="text-lg font-semibold">
              {projectName}
            </h3>
          )}
          {session.summary && (
            <p className="text-sm text-foreground mt-2">
              {session.summary}
            </p>
          )}

          {/* First Episode Preview */}
          {previewContent && (
            <div className="mt-2 flex justify-end">
              <div className="bg-muted text-foreground px-3 py-2 rounded-2xl text-xs max-w-[80%]">
                <span className="line-clamp-2">{previewContent.content}</span>
              </div>
            </div>
          )}

          {/* Timeline Bar */}
          <div className="mt-3">
            <TimelineBar
              startTime={session.first_episode_date}
              endTime={session.last_episode_date}
              showHourMarkers={true}
              showTimeLabels={false}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {timeRange} ({duration})
            {dateInfo && ` • ${dateInfo}`} • {session.episode_count} episode
            {session.episode_count !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
