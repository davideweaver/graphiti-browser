import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Calendar, Clock, Hash, Info, Trash2 } from "lucide-react";
import { ChatMessage } from "@/components/episodes/ChatMessage";
import { TimelineBar } from "@/components/episodes/TimelineBar";
import { NodeDetailSheet } from "@/components/shared/NodeDetailSheet";
import { format, differenceInMinutes } from "date-fns";
import DeleteConfirmationDialog from "@/components/dialogs/DeleteConfirmationDialog";

export default function SessionDetail() {
  const { sessionId } = useParams<{
    sessionId: string;
    projectName?: string;
  }>();
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Navigate back using browser history (respects where user actually came from)
  const goBack = () => {
    navigate(-1);
  };

  // Fetch session details (includes episodes and metadata)
  const {
    data: sessionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["session", groupId, sessionId],
    queryFn: () => graphitiService.getSession(sessionId!, groupId),
    enabled: !!sessionId,
  });

  // Mutation for deleting session
  const deleteSessionMutation = useMutation({
    mutationFn: () => graphitiService.deleteSession(sessionId!, groupId),
    onSuccess: () => {
      // Remove queries from cache before navigation to prevent 404 errors
      queryClient.removeQueries({ queryKey: ["session", groupId, sessionId] });

      // Navigate back using browser history
      goBack();
    },
  });

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteSessionMutation.mutate();
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Container title="Session Detail" description="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  if (!sessionData) {
    return (
      <Container
        title="Session Not Found"
        description="The session could not be found"
      >
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Session not found</h3>
            <p className="text-muted-foreground mb-4">
              The session you're looking for doesn't exist or couldn't be
              loaded.
            </p>
            {error && (
              <p className="text-sm text-destructive mb-4">
                Error:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              Session ID: {sessionId}
              <br />
              Group ID: {groupId}
            </p>
            <Button onClick={goBack}>Go Back</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!sessionData.episodes || sessionData.episodes.length === 0) {
    return (
      <Container
        title="Session Not Found"
        description="No episodes found for this session"
      >
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No episodes found</h3>
            <p className="text-muted-foreground mb-4">
              This session exists but has no episodes.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Session ID: {sessionData.session_id}
              <br />
              Episode Count: {sessionData.episode_count}
            </p>
            <Button onClick={goBack}>Go Back</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Calculate session duration
  const startDate = new Date(sessionData.first_episode_date);
  const endDate = new Date(sessionData.last_episode_date);
  const durationMins = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <Container
      title={
        sessionData.project_name
          ? `${sessionData.project_name} Session`
          : "Session"
      }
      description="View session messages and conversation history"
      tools={
        <div className="flex gap-2">
          <ContainerToolButton size="sm" onClick={goBack}>
            <ChevronLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </ContainerToolButton>
          <ContainerToolButton size="sm" onClick={() => setSheetOpen(true)}>
            <Info className="h-4 w-4 mr-2" />
            Info
          </ContainerToolButton>
          <ContainerToolButton
            onClick={handleOpenDeleteDialog}
            disabled={deleteSessionMutation.isPending}
            size="icon"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
          </ContainerToolButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Session Summary Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {/* Summary */}
            {sessionData.summary && (
              <div>
                <p className="text-sm text-muted-foreground">
                  {sessionData.summary}
                </p>
              </div>
            )}

            {/* Timeline Bar */}
            <div>
              <TimelineBar
                startTime={sessionData.first_episode_date}
                endTime={sessionData.last_episode_date}
                showHourMarkers={true}
                showTimeLabels={false}
              />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  Date
                </div>
                <div className="text-sm font-medium">
                  {format(startDate, "MMM d, yyyy")}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Time
                </div>
                <div className="text-sm font-medium">
                  {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Duration
                </div>
                <div className="text-sm font-medium">{duration}</div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Hash className="h-3 w-3" />
                  Episodes
                </div>
                <div className="text-sm font-medium">
                  {sessionData.episode_count}
                </div>
              </div>

              {sessionData.programmatic !== undefined && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Type</div>
                  <div className="text-sm font-medium">
                    <Badge
                      variant={
                        sessionData.programmatic ? "secondary" : "default"
                      }
                    >
                      {sessionData.programmatic ? "Programmatic" : "Manual"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Project and Sources */}
            {(sessionData.project_name ||
              (sessionData.source_descriptions &&
                sessionData.source_descriptions.length > 0)) && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-6 flex-wrap">
                  {/* Project */}
                  {sessionData.project_name && (
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">Project</h4>
                      <Link
                        to={`/project/${encodeURIComponent(sessionData.project_name)}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {sessionData.project_name}
                      </Link>
                    </div>
                  )}

                  {/* Sources */}
                  {sessionData.source_descriptions &&
                    sessionData.source_descriptions.length > 0 && (
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">Sources</h4>
                        <div className="flex flex-wrap gap-2">
                          {sessionData.source_descriptions.map(
                            (source, index) => (
                              <Badge key={index} variant="secondary">
                                {source}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Messages */}
        <div className="space-y-0">
          {sessionData.episodes.map((episode) => {
            // Parse new format: "[<user_type>]: <message>"
            const match = episode.content.match(/^\[(.+?)\]:\s*(.+)$/s);

            let role = "Unknown";
            let content = episode.content;
            let isUser = false;

            if (match) {
              const userType = match[1].trim().toLowerCase();
              content = match[2].trim();
              isUser = userType === "user";
              role = userType.charAt(0).toUpperCase() + userType.slice(1);
            }

            return (
              <ChatMessage
                key={episode.uuid}
                role={role}
                content={content}
                isUser={isUser}
              />
            );
          })}
        </div>
      </div>

      {/* NodeDetailSheet for graph navigation */}
      <NodeDetailSheet
        nodeType="session"
        nodeId={sessionData.uuid || null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      {/* Delete Session Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Session"
        description={`Are you sure you want to delete this session? This will permanently delete ${sessionData?.episode_count || 0} episode${sessionData?.episode_count !== 1 ? "s" : ""} from this session. This action cannot be undone.`}
      />
    </Container>
  );
}
