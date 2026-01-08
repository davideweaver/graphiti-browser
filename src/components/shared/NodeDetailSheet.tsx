import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GraphNavigator } from "./GraphNavigator";
import type { Fact, Session, SessionDetailResponse, Entity, Project } from "@/types/graphiti";
import { formatDistanceToNow, format } from "date-fns";

type NodeType = "fact" | "session" | "entity" | "project";

interface NodeDetailSheetProps {
  nodeType: NodeType;
  nodeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NodeDetailSheet({ nodeType, nodeId, open, onOpenChange }: NodeDetailSheetProps) {
  const { groupId } = useGraphiti();
  const [activeTab, setActiveTab] = useState("metadata");

  // Reset to metadata tab when opening a new node
  useEffect(() => {
    if (open && nodeId) {
      setActiveTab("metadata");
    }
  }, [open, nodeId]);

  // Fetch node data based on type
  const { data: nodeData, isLoading } = useQuery({
    queryKey: [nodeType, nodeId, groupId],
    queryFn: async () => {
      if (!nodeId) return null;

      switch (nodeType) {
        case "fact":
          return await graphitiService.getFactDetails(nodeId, groupId);
        case "session":
          return await graphitiService.getSession(nodeId, groupId);
        case "entity":
          return await graphitiService.getEntity(nodeId, groupId);
        case "project":
          // Fetch project by name
          const result = await graphitiService.listProjects(groupId, 1, undefined, nodeId);
          return result.projects[0] || null;
        default:
          return null;
      }
    },
    enabled: open && !!nodeId,
  });

  // Get title and description based on node type
  const getNodeTitle = () => {
    if (!nodeData) return "Loading...";

    switch (nodeType) {
      case "fact":
        return (nodeData as Fact).fact || "Fact";
      case "session":
        return (nodeData as Session).name || `Session ${(nodeData as Session).session_id}`;
      case "entity":
        return (nodeData as Entity).name || "Entity";
      case "project":
        return (nodeData as Project).name || "Project";
      default:
        return "Node";
    }
  };

  const getNodeDescription = () => {
    if (!nodeData) return "";

    switch (nodeType) {
      case "fact":
        return `${(nodeData as Fact).fact_type || "Fact"} • Valid from ${formatDistanceToNow(new Date((nodeData as Fact).valid_at))} ago`;
      case "session":
        return `${(nodeData as Session).episode_count || 0} episodes`;
      case "entity":
        // Show entity type instead of summary (summary is in metadata tab)
        const entity = nodeData as Entity;
        const entityType = entity.labels.find((label) => label !== "Entity") || entity.entity_type || "Entity";
        return entityType;
      case "project":
        const project = nodeData as Project;
        return `${project.episode_count} episodes • ${project.session_count} sessions`;
      default:
        return "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">
            {isLoading ? <Skeleton className="h-6 w-3/4" /> : getNodeTitle()}
          </SheetTitle>
          <SheetDescription>
            {isLoading ? <Skeleton className="h-4 w-1/2" /> : getNodeDescription()}
          </SheetDescription>
        </SheetHeader>

        {!isLoading && nodeData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="navigator">Navigator</TabsTrigger>
            </TabsList>

            <TabsContent value="metadata" className="mt-4">
              <MetadataView nodeType={nodeType} nodeData={nodeData} />
            </TabsContent>

            <TabsContent value="navigator" className="mt-4">
              <GraphNavigator
                key={nodeId}
                nodeType={nodeType}
                nodeId={nodeType === "project" ? (nodeData as Project).uuid || nodeId! : nodeId!}
                groupId={groupId}
              />
            </TabsContent>
          </Tabs>
        )}

        {isLoading && (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

interface MetadataViewProps {
  nodeType: NodeType;
  nodeData: Fact | Session | Entity | Project;
}

function MetadataView({ nodeType, nodeData }: MetadataViewProps) {
  switch (nodeType) {
    case "fact":
      return <FactMetadata fact={nodeData as Fact} />;
    case "session":
      return <SessionMetadata session={nodeData as Session} />;
    case "entity":
      return <EntityMetadata entity={nodeData as Entity} />;
    case "project":
      return <ProjectMetadata project={nodeData as Project} />;
    default:
      return null;
  }
}

function FactMetadata({ fact }: { fact: Fact }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Fact</div>
            <div className="text-sm">{fact.fact}</div>
          </div>

          {fact.fact_type && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Type</div>
              <Badge variant="secondary">{fact.fact_type}</Badge>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Valid At</div>
            <div className="text-sm">{new Date(fact.valid_at).toLocaleString()}</div>
          </div>

          {fact.invalid_at && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Invalid At</div>
              <div className="text-sm">{new Date(fact.invalid_at).toLocaleString()}</div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">UUID</div>
            <div className="text-xs font-mono">{fact.uuid}</div>
          </div>

          {fact.score !== undefined && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Relevance Score</div>
              <div className="text-sm">{(fact.score * 100).toFixed(1)}%</div>
            </div>
          )}
        </CardContent>
      </Card>

      {fact.entities && fact.entities.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-3">Related Entities</div>
            <div className="space-y-2">
              {fact.entities.map((entity) => (
                <div key={entity.uuid} className="flex items-center gap-2">
                  <Badge variant="outline">{entity.name}</Badge>
                  <span className="text-xs text-muted-foreground">{entity.summary}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SessionMetadata({ session }: { session: Session }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          {session.name && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
              <div className="text-sm">{session.name}</div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Session ID</div>
            <div className="text-xs font-mono">{session.session_id}</div>
          </div>

          {session.project_name && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Project</div>
              <Badge variant="secondary">{session.project_name}</Badge>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Episodes</div>
            <div className="text-sm">{session.episode_count}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
            <div className="text-sm">{new Date(session.created_at).toLocaleString()}</div>
          </div>

          {session.last_episode_date && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Last Episode</div>
              <div className="text-sm">{new Date(session.last_episode_date).toLocaleString()}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {session.summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
            <div className="text-sm">{session.summary}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EntityMetadata({ entity }: { entity: Entity }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
            <div className="text-sm font-semibold">{entity.name}</div>
          </div>

          {entity.labels && entity.labels.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Labels</div>
              <div className="flex flex-wrap gap-1">
                {entity.labels.map((label, idx) => (
                  <Badge key={idx} variant="secondary">{label}</Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">UUID</div>
            <div className="text-xs font-mono">{entity.uuid}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
            <div className="text-sm">{new Date(entity.created_at).toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      {entity.summary && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-medium text-muted-foreground mb-2">Summary</div>
            <div className="text-sm">{entity.summary}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ProjectMetadata({ project }: { project: Project }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Name</div>
            <div className="text-sm font-semibold">{project.name}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">UUID</div>
            <div className="text-xs font-mono">{project.uuid}</div>
          </div>

          {project.project_path && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Path</div>
              <div className="text-xs font-mono break-all">{project.project_path}</div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Episodes</div>
            <div className="text-sm">{project.episode_count}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Sessions</div>
            <div className="text-sm">{project.session_count}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">First Episode</div>
            <div className="text-sm">{format(new Date(project.first_episode_date), "PPP")}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Last Episode</div>
            <div className="text-sm">{format(new Date(project.last_episode_date), "PPP")}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Group ID</div>
            <div className="text-xs font-mono">{project.group_id}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
