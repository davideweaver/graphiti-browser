import { useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { ChatMessage } from "@/components/episodes/ChatMessage";
import { parseSourceDescription } from "@/lib/utils";
import { format } from "date-fns";

export default function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  // Fetch episodes for this session directly
  const { data: sessionEpisodes, isLoading } = useQuery({
    queryKey: ["session", groupId, sessionId],
    queryFn: () => graphitiService.getSession(sessionId!, groupId),
    enabled: !!sessionId,
  });

  // Extract session metadata from first episode
  const sessionInfo = useMemo(() => {
    if (!sessionEpisodes || sessionEpisodes.length === 0) return null;

    const firstEpisode = sessionEpisodes[0];
    const parsed = parseSourceDescription(firstEpisode.source_description);

    if (!parsed) return null;

    const dates = sessionEpisodes.map(e => new Date(e.created_at).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));

    return {
      app: parsed.app,
      folder: parsed.folder,
      dateRange: format(minDate, "MMM d, yyyy"),
      timeRange: `${format(minDate, "h:mm a")} - ${format(maxDate, "h:mm a")}`,
      episodeCount: sessionEpisodes.length,
    };
  }, [sessionEpisodes]);

  if (isLoading) {
    return (
      <Container title="Session Detail" description="Loading...">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
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

  if (!sessionInfo || !sessionEpisodes || sessionEpisodes.length === 0) {
    return (
      <Container title="Session Not Found" description="The session could not be found">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Session not found</h3>
              <p className="text-muted-foreground mb-4">
                The session you're looking for doesn't exist or couldn't be loaded.
              </p>
              <Button onClick={() => navigate(dateParam ? `/sessions?date=${dateParam}` : "/sessions")}>
                Back to Sessions
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={sessionInfo.folder}
      description={`${sessionInfo.app} • ${sessionInfo.dateRange} • ${sessionInfo.timeRange} • ${sessionInfo.episodeCount} episode${sessionInfo.episodeCount !== 1 ? "s" : ""}`}
      tools={
        <Button
          variant="outline"
          onClick={() => navigate(dateParam ? `/sessions?date=${dateParam}` : "/sessions")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto p-6">
        {/* Session Messages */}
        <div className="space-y-0">
          {sessionEpisodes.map((episode) => {
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
    </Container>
  );
}
