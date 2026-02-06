import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGraphiti } from "@/context/GraphitiContext";
import { graphitiService } from "@/api/graphitiService";
import type { Fact } from "@/types/graphiti";
import Container from "@/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle, ExternalLink } from "lucide-react";

export default function FactDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const [fact, setFact] = useState<Fact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uuid) return;

    const fetchFact = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await graphitiService.getFactDetails(uuid, groupId);
        setFact(data);
      } catch (err) {
        console.error("Failed to fetch fact details:", err);
        setError(err instanceof Error ? err.message : "Failed to load fact details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFact();
  }, [uuid, groupId]);

  const isInvalid = fact?.invalid_at && fact?.valid_at === fact?.invalid_at;

  if (isLoading) {
    return (
      <Container title="Fact Details" description="Loading fact information...">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </Container>
    );
  }

  if (error || !fact) {
    return (
      <Container title="Error" description="Failed to load fact">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Fact</h3>
            <p className="text-muted-foreground mb-4">
              {error || "The requested fact could not be found."}
            </p>
            <Button onClick={() => navigate("/memory/search")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container
      title="Fact Details"
      description="Complete provenance and metadata for this fact"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/memory/search")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          {isInvalid && (
            <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Invalidated
            </Badge>
          )}
        </div>

        {/* Fact Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fact</span>
              {fact.similarity_score != null && (
                <Badge variant="secondary">
                  Score: {fact.similarity_score.toFixed(3)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{fact.fact}</p>
            {isInvalid && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Immediately Invalidated
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      This fact was invalidated on the same date it became valid, suggesting it may have been
                      superseded by newer or more accurate information.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Relationship */}
        {fact.source_entity && fact.target_entity && (
          <Card>
            <CardHeader>
              <CardTitle>Entity Relationship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Source Entity */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Source Entity</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-base py-1 px-3">
                      {fact.source_entity.name}
                    </Badge>
                    {fact.source_entity.labels.map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  {fact.source_entity.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {fact.source_entity.summary}
                    </p>
                  )}
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/entities/${fact.source_entity.uuid}`} target="_blank" rel="noopener noreferrer">
                        View Entity
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Relationship Type */}
                <div className="flex items-center justify-center py-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-2xl">→</div>
                    <Badge variant="secondary" className="text-sm px-4 py-1">
                      {fact.name}
                    </Badge>
                    <div className="text-2xl">→</div>
                  </div>
                </div>

                {/* Target Entity */}
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Target Entity</div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="default" className="text-base py-1 px-3">
                      {fact.target_entity.name}
                    </Badge>
                    {fact.target_entity.labels.map((label) => (
                      <Badge key={label} variant="outline">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  {fact.target_entity.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {fact.target_entity.summary}
                    </p>
                  )}
                  <div className="mt-2">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`/entities/${fact.target_entity.uuid}`} target="_blank" rel="noopener noreferrer">
                        View Entity
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Episodes */}
        {fact.episodes && fact.episodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Source Episodes ({fact.episodes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fact.episodes.map((episode, idx) => (
                  <div key={episode.uuid}>
                    {idx > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      {/* Episode Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{episode.name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>{format(new Date(episode.valid_at), "MMM d, yyyy 'at' h:mm a")}</span>
                            {episode.session_id && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-xs">
                                  Session: {episode.session_id.substring(0, 8)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {episode.source_description && (
                          <Badge variant="outline" className="flex-shrink-0">
                            {episode.source_description}
                          </Badge>
                        )}
                      </div>

                      {/* Episode Content */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{episode.content}</p>
                      </div>

                      {/* Episode Actions */}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={`/sessions/${groupId}/${episode.session_id}`}>
                            View Session
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-1">Created</dt>
                <dd className="text-sm">{format(new Date(fact.created_at), "MMM d, yyyy 'at' h:mm a")}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground mb-1">Valid From</dt>
                <dd className="text-sm">{format(new Date(fact.valid_at), "MMM d, yyyy")}</dd>
              </div>
              {fact.invalid_at && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Invalid From</dt>
                  <dd className="text-sm">{format(new Date(fact.invalid_at), "MMM d, yyyy")}</dd>
                </div>
              )}
              {fact.expired_at && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Expired</dt>
                  <dd className="text-sm">{format(new Date(fact.expired_at), "MMM d, yyyy")}</dd>
                </div>
              )}
              {fact.similarity_score != null && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Similarity Score</dt>
                  <dd className="text-sm font-mono">{fact.similarity_score.toFixed(4)}</dd>
                </div>
              )}
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground mb-1">UUID</dt>
                <dd className="text-sm font-mono break-all">{fact.uuid}</dd>
              </div>
              {fact.source_node_uuid && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Source Node UUID</dt>
                  <dd className="text-sm font-mono break-all">{fact.source_node_uuid}</dd>
                </div>
              )}
              {fact.target_node_uuid && (
                <div className="md:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Target Node UUID</dt>
                  <dd className="text-sm font-mono break-all">{fact.target_node_uuid}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
