import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { xerroProjectsService } from "@/api/xerroProjectsService";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Calendar, Clock, Hash } from "lucide-react";
import { ChatMessage } from "@/components/episodes/ChatMessage";
import { TimelineBar } from "@/components/episodes/TimelineBar";
import { Button } from "@/components/ui/button";
import { format, differenceInMinutes, parseISO } from "date-fns";

export default function XerroSessionDetail() {
  const { sessionId, projectName: encodedProjectName } = useParams<{
    sessionId: string;
    projectName: string;
  }>();
  const navigate = useNavigate();

  const projectName = encodedProjectName ? decodeURIComponent(encodedProjectName) : "";

  const {
    data: session,
    isLoading: isLoadingSession,
  } = useQuery({
    queryKey: ["xerro-session", sessionId],
    queryFn: () => xerroProjectsService.getSession(sessionId!),
    enabled: !!sessionId,
  });

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
  } = useQuery({
    queryKey: ["xerro-session-messages", sessionId],
    queryFn: () => xerroProjectsService.getSessionMessages(sessionId!, { order: "asc" }),
    enabled: !!sessionId,
  });

  const isLoading = isLoadingSession || isLoadingMessages;

  const goBack = () => navigate(-1);

  if (isLoading) {
    return (
      <Container title="Session Detail" description="Loading...">
        <div className="space-y-6">
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

  if (!session) {
    return (
      <Container title="Session Not Found" description="The session could not be found">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Session not found</h3>
            <p className="text-muted-foreground mb-4">
              The session you're looking for doesn't exist or couldn't be loaded.
            </p>
            <p className="text-xs text-muted-foreground mb-4">Session ID: {sessionId}</p>
            <Button onClick={goBack}>Go Back</Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const messages = messagesData?.messages ?? [];

  const startDate = parseISO(session.startedAt);
  const endDate = parseISO(session.lastMessageAt);
  const durationMins = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return (
    <Container
      title={projectName ? `${projectName} Session` : "Session"}
      description="View session messages and conversation history"
      tools={
        <ContainerToolButton size="sm" onClick={goBack}>
          <ChevronLeft className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Back</span>
        </ContainerToolButton>
      }
    >
      <div className="space-y-6">
        {/* Session Summary Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}

            <TimelineBar
              startTime={session.startedAt}
              endTime={session.lastMessageAt}
              showHourMarkers={true}
              showTimeLabels={false}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Calendar className="h-3 w-3" />
                  Date
                </div>
                <div className="text-sm font-medium">{format(startDate, "MMM d, yyyy")}</div>
              </div>

              <div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Time
                </div>
                <div className="text-sm font-medium">
                  {format(startDate, "h:mm a")} – {format(endDate, "h:mm a")}
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
                  Messages
                </div>
                <div className="text-sm font-medium">{session.messageCount}</div>
              </div>
            </div>

            {session.externalSource && (
              <div className="pt-4 border-t flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Source</span>
                <Badge variant="secondary">{session.externalSource}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        {messages.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No messages found for this session.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role === "user" ? "User" : "Assistant"}
                content={message.content}
                isUser={message.role === "user"}
                permissionMode={message.permissionMode}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
