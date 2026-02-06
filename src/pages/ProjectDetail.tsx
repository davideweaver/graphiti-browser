import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import { FactCard } from "@/components/search/FactCard";
import { SessionRow } from "@/components/episodes/SessionRow";
import { ProjectTimelineBar } from "@/components/episodes/ProjectTimelineBar";
import { NodeDetailSheet } from "@/components/shared/NodeDetailSheet";
import { format } from "date-fns";

export default function ProjectDetail() {
  const { projectName: encodedProjectName } = useParams<{ projectName: string }>();
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Decode the project name from URL
  const projectName = encodedProjectName ? decodeURIComponent(encodedProjectName) : "";

  // Fetch project metadata by listing projects with name filter
  const { data: projectData, isLoading: isLoadingProject } = useQuery({
    queryKey: ["project-metadata", groupId, projectName],
    queryFn: async () => {
      const result = await graphitiService.listProjects(groupId, 1, undefined, projectName);
      return result.projects[0] || null;
    },
    enabled: !!projectName,
  });

  // Fetch sessions for this project
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["project-sessions", groupId, projectName],
    queryFn: () => graphitiService.getProjectSessions(groupId, projectName, 100),
    enabled: !!projectName,
  });

  // Fetch entities for this project
  const { data: entitiesData, isLoading: isLoadingEntities } = useQuery({
    queryKey: ["project-entities", groupId, projectName],
    queryFn: () => graphitiService.getProjectEntities(groupId, projectName, 100),
    enabled: !!projectName,
  });

  // Fetch facts for this project
  const { data: factsData, isLoading: isLoadingFacts } = useQuery({
    queryKey: ["project-facts", groupId, projectName],
    queryFn: () => graphitiService.search(projectName, groupId, 50),
    enabled: !!projectName,
  });

  const sessions = sessionsData?.sessions || [];
  const entities = entitiesData?.entities || [];
  const facts = factsData?.facts || [];

  const getEntityTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "person":
        return "bg-blue-500/10 text-blue-500";
      case "organization":
        return "bg-purple-500/10 text-purple-500";
      case "location":
        return "bg-green-500/10 text-green-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  if (isLoadingProject) {
    return (
      <Container title="Project Detail" description="Loading...">
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

  if (!projectData) {
    return (
      <Container title="Project Not Found" description="The project could not be found">
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Project not found</h3>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or couldn't be loaded.
            </p>
            <Button onClick={() => navigate("/projects")}>
              Back to Projects
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      title={projectName}
      description={projectData.project_path || undefined}
      tools={
        <Button
          variant="secondary"
          onClick={() => setSheetOpen(true)}
        >
          <Info className="h-4 w-4 mr-2" />
          Metadata
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Project Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Episodes</div>
                <div className="text-2xl font-semibold">{projectData.episode_count}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Sessions</div>
                <div className="text-2xl font-semibold">{projectData.session_count}</div>
              </div>
              <div>
                <div className="text-muted-foreground">First Episode</div>
                <div className="font-medium">
                  {format(new Date(projectData.first_episode_date), "MMM d, yyyy")}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Episode</div>
                <div className="font-medium">
                  {format(new Date(projectData.last_episode_date), "MMM d, yyyy")}
                </div>
              </div>
            </div>

            {/* Project Timeline */}
            {sessions.length > 0 && (
              <ProjectTimelineBar
                sessions={sessions}
                projectStartDate={projectData.first_episode_date}
                projectEndDate={projectData.last_episode_date}
              />
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="sessions">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">
              Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="entities">
              Relationships ({entities.length})
            </TabsTrigger>
            <TabsTrigger value="facts">
              Facts ({facts.length})
            </TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-6">
            {isLoadingSessions && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoadingSessions && sessions.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No sessions found for this project
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoadingSessions && sessions.length > 0 && (
              <>
                <div className="space-y-4">
                  {sessions.map((session, sessionIndex) => (
                    <div key={session.session_id}>
                      <SessionRow
                        session={session}
                        showProject={false}
                        onSessionClick={(sessionId) =>
                          navigate(`/project/${encodeURIComponent(projectName)}/sessions/${encodeURIComponent(sessionId)}`)
                        }
                      />
                      {sessionIndex < sessions.length - 1 && (
                        <Separator className="mt-4" />
                      )}
                    </div>
                  ))}
                </div>
                {sessions.length >= 10 && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/project/${encodeURIComponent(projectName)}/sessions`)}
                    >
                      View All Sessions
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Entities Tab */}
          <TabsContent value="entities" className="mt-6">
            {isLoadingEntities && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoadingEntities && entities.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No entities found for this project
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoadingEntities && entities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entities.map((entity) => {
                  const entityType = entity.labels.find((label) => label !== "Entity") || entity.entity_type || "Unknown";
                  return (
                    <Card
                      key={entity.uuid}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/memory/entity/${entity.uuid}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{entity.name}</h3>
                          <Badge
                            variant="secondary"
                            className={getEntityTypeColor(entityType)}
                          >
                            {entityType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entity.summary}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Facts Tab */}
          <TabsContent value="facts" className="mt-6">
            {isLoadingFacts && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/4 mb-4" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoadingFacts && facts.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No facts found for this project
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoadingFacts && facts.length > 0 && (
              <div className="space-y-2">
                {facts.map((fact) => (
                  <FactCard key={fact.uuid} fact={fact} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* NodeDetailSheet for graph navigation */}
      <NodeDetailSheet
        nodeType="project"
        nodeId={projectName || null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Container>
  );
}
