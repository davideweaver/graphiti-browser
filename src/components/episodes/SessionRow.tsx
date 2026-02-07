import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TimelineBar } from "./TimelineBar";
import { format, differenceInMinutes } from "date-fns";
import { Info, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";
import { NodeDetailSheet } from "@/components/shared/NodeDetailSheet";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import { useToast } from "@/hooks/use-toast";
import type { Session } from "@/types/graphiti";

interface SessionRowProps {
  session: Session;
  showProject?: boolean;
  onSessionClick?: (sessionId: string) => void;
  onSessionDeleted?: (sessionId: string) => void;
}

export function SessionRow({
  session,
  showProject = true,
  onSessionClick,
  onSessionDeleted,
}: SessionRowProps) {
  const navigate = useNavigate();
  const { groupId } = useGraphiti();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await graphitiService.deleteSession(session.session_id, groupId);
    },
    onSuccess: () => {
      // Notify parent component to remove the session from its local state
      onSessionDeleted?.(session.session_id);
    },
    onError: (error) => {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSheetOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteDialogOpen(false);
    await deleteMutation.mutateAsync();
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        className="bg-background py-2 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors relative"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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
          {session.programmatic !== undefined && ` • ${session.programmatic ? "Programmatic" : "Manual"}`}
        </p>

        {/* Action Buttons - Show on Hover */}
        {isHovered && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-md p-0.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInfoClick}
              className="h-8 w-8 p-0"
              aria-label="View session details"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDeleteClick}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Delete session"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
    </div>

    {/* Session Detail Sheet */}
    <NodeDetailSheet
      nodeType="session"
      nodeId={session.session_id}
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      groupId={groupId}
    />

    {/* Delete Confirmation Dialog */}
    <DeleteConfirmationDialog
      open={deleteDialogOpen}
      onOpenChange={setDeleteDialogOpen}
      onDelete={handleConfirmDelete}
      onCancel={handleCancelDelete}
      title="Delete Session"
      description={`Are you sure you want to delete this session${session.project_name ? ` from ${session.project_name}` : ""}? This action cannot be undone.`}
    />
    </>
  );
}
