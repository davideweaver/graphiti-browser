import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { graphitiService } from "@/api/graphitiService";
import { useGraphitiWebSocket } from "@/hooks/use-graphiti-websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FactCard } from "@/components/search/FactCard";
import { EntityCard } from "@/components/entities/EntityCard";
import { NodeDetailSheet } from "@/components/shared/NodeDetailSheet";
import { Loader2, CheckCircle2, Download, Plus, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  sourceUuid: string;
  groupId: string;
}

export default function ExtractionResults({ sourceUuid, groupId }: Props) {
  const navigate = useNavigate();
  const { queueSize, isProcessing } = useGraphitiWebSocket();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Poll extraction results every 2 seconds until complete
  const { data, isLoading, error } = useQuery({
    queryKey: ["source-extraction", sourceUuid, groupId],
    queryFn: () => graphitiService.getSourceExtractionResults(sourceUuid, groupId),
    refetchInterval: (data) => {
      // Stop polling if processing is complete
      return data?.processing_complete ? false : 2000;
    },
    retry: 3,
  });

  const handleExportResults = () => {
    if (!data) return;

    const exportData = {
      source: data.source,
      episodes: data.episodes,
      facts: data.facts,
      entities: data.entities,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `extraction-results-${sourceUuid}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Results exported successfully");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Processing Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Results</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {(error as Error).message}
          </p>
          <Button onClick={() => navigate("/memory/add")} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add More Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { source, episodes, facts, entities, processing_complete } = data;

  return (
    <div className="space-y-6">
      {/* Processing Status */}
      {!processing_complete && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">Extracting facts and entities...</p>
                <p className="text-sm text-muted-foreground">
                  {isProcessing
                    ? `Processing queue: ${queueSize} item${queueSize !== 1 ? "s" : ""} remaining`
                    : "Processing complete, finalizing results..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Status */}
      {processing_complete && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">Processing complete!</p>
                <p className="text-sm text-muted-foreground">
                  Your content has been successfully processed and added to the memory graph.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Metadata */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Source</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSheetOpen(true)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View in Graph
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">{source.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {source.attributes?.source_type || "unknown"}
              </Badge>
              {source.created_at && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(source.created_at), "MMM d, h:mm a")}
                </span>
              )}
            </div>
          </div>
          {source.summary && (
            <p className="text-xs text-muted-foreground">{source.summary}</p>
          )}
        </CardContent>
      </Card>

      {/* Extraction Results Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="facts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="facts">
                Facts ({facts.length})
              </TabsTrigger>
              <TabsTrigger value="entities">
                Entities ({entities.length})
              </TabsTrigger>
              <TabsTrigger value="episodes">
                Episodes ({episodes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="facts" className="mt-6">
              {facts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {processing_complete
                    ? "No facts extracted"
                    : "Facts will appear as they are extracted..."}
                </p>
              ) : (
                <div className="space-y-3">
                  {facts.map((fact) => (
                    <FactCard key={fact.uuid} fact={fact} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="entities" className="mt-6">
              {entities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {processing_complete
                    ? "No entities extracted"
                    : "Entities will appear as they are extracted..."}
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {entities.map((entity) => (
                    <EntityCard key={entity.uuid} entity={entity} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="episodes" className="mt-6">
              {episodes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No episodes created yet
                </p>
              ) : (
                <div className="space-y-2">
                  {episodes.map((episode) => (
                    <div
                      key={episode.uuid}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium mb-1">{episode.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {episode.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(episode.created_at), "PPp")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => navigate("/memory/add")}>
          <Plus className="w-4 h-4 mr-2" />
          Add More Content
        </Button>
        <Button variant="outline" onClick={handleExportResults}>
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </Button>
      </div>

      {/* Node Detail Sheet */}
      {source && (
        <NodeDetailSheet
          nodeType="source"
          nodeId={source.uuid}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          groupId={groupId}
        />
      )}
    </div>
  );
}
