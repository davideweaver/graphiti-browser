import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useGraphiti } from "@/context/GraphitiContext";
import { graphitiService } from "@/api/graphitiService";
import type { Fact } from "@/types/graphiti";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, AlertTriangle } from "lucide-react";

interface FactDetailDrawerProps {
  fact: Fact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FactDetailDrawer({ fact, open, onOpenChange }: FactDetailDrawerProps) {
  const { groupId } = useGraphiti();
  const [supersededBy, setSupersededBy] = useState<Fact[]>([]);
  const [supersedes, setSupersedes] = useState<Fact[]>([]);
  const [relatedFacts, setRelatedFacts] = useState<Fact[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [activeTab, setActiveTab] = useState("superseded-by");

  // Fetch fact provenance when any provenance tab is opened
  useEffect(() => {
    if (!fact || !open) return;
    if (!["superseded-by", "supersedes", "related"].includes(activeTab)) return;

    const fetchRelatedFacts = async () => {
      setIsLoadingRelated(true);
      try {
        const data = await graphitiService.getRelatedFacts(fact.uuid, groupId);
        setSupersededBy(data.superseded_by || []);
        setSupersedes(data.supersedes || []);
        setRelatedFacts(data.related || []);
      } catch (error) {
        console.error("Failed to fetch related facts:", error);
        setSupersededBy([]);
        setSupersedes([]);
        setRelatedFacts([]);
      } finally {
        setIsLoadingRelated(false);
      }
    };

    fetchRelatedFacts();
  }, [fact, open, activeTab, groupId]);

  if (!fact) return null;

  const isInvalid = fact.invalid_at && fact.valid_at === fact.invalid_at;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        transparentOverlay={true}
        side="right"
        className="w-full sm:w-[400px] lg:w-[500px] sm:max-w-[400px] lg:max-w-[500px] p-0 overflow-y-auto flex flex-col"
      >
        {/* Full-width header section */}
        <div className="bg-muted/30 border-b p-6 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">Fact Details</h2>
            {isInvalid && (
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>

          {/* Fact content */}
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-foreground">
              {fact.fact}
            </p>

            {isInvalid && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  This fact was immediately invalidated, suggesting it may have been superseded by newer information.
                </p>
              </div>
            )}

            {/* Quick Stats */}
            <dl className="grid grid-cols-2 gap-3 text-sm pt-2">
              <div>
                <dt className="text-muted-foreground text-xs">Relationship</dt>
                <dd className="font-medium">
                  <Badge variant="secondary" className="text-xs">{fact.name}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Created</dt>
                <dd className="font-medium">{format(new Date(fact.created_at), "MMM d, yyyy")}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Valid From</dt>
                <dd className="font-medium">{format(new Date(fact.valid_at), "MMM d, yyyy")}</dd>
              </div>
              {fact.similarity_score != null && (
                <div>
                  <dt className="text-muted-foreground text-xs">Relevance</dt>
                  <dd className="font-mono font-medium">{fact.similarity_score.toFixed(3)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="text-foreground px-6 pt-2 grid grid-cols-4 w-full">
              <TabsTrigger value="superseded-by">Superseded</TabsTrigger>
              <TabsTrigger value="supersedes">Supersedes</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            {/* Superseded By Tab */}
            <TabsContent value="superseded-by" className="p-6 space-y-6">
              {isLoadingRelated ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : supersededBy.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Facts that Replaced This One</h3>
                    <p className="text-xs text-muted-foreground">
                      Created around when this fact was invalidated
                    </p>
                  </div>
                  {supersededBy.map((relatedFact) => (
                    <Card key={relatedFact.uuid} className="border-orange-200 dark:border-orange-900">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm leading-relaxed">{relatedFact.fact}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Created: {format(new Date(relatedFact.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            asChild
                          >
                            <a href={`/facts/${relatedFact.uuid}`} target="_blank" rel="noopener noreferrer">
                              View
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No facts have superseded this one.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Supersedes Tab */}
            <TabsContent value="supersedes" className="p-6 space-y-6">
              {isLoadingRelated ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : supersedes.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Facts This One Replaced</h3>
                    <p className="text-xs text-muted-foreground">
                      Invalidated around when this fact was created
                    </p>
                  </div>
                  {supersedes.map((relatedFact) => (
                    <Card key={relatedFact.uuid} className="border-blue-200 dark:border-blue-900">
                      <CardContent className="p-4 space-y-2">
                        <p className="text-sm leading-relaxed">{relatedFact.fact}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Invalidated: {relatedFact.invalid_at ? format(new Date(relatedFact.invalid_at), "MMM d, yyyy 'at' h:mm a") : 'N/A'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            asChild
                          >
                            <a href={`/facts/${relatedFact.uuid}`} target="_blank" rel="noopener noreferrer">
                              View
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      This fact hasn't superseded any others.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Related Facts Tab */}
            <TabsContent value="related" className="p-6 space-y-6">
              {isLoadingRelated ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : relatedFacts.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Other Related Facts</h3>
                    <p className="text-xs text-muted-foreground">
                      Facts involving the same entities
                    </p>
                  </div>
                  {relatedFacts.slice(0, 10).map((relatedFact) => (
                    <Card key={relatedFact.uuid}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm leading-relaxed flex-1">{relatedFact.fact}</p>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {relatedFact.name}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{format(new Date(relatedFact.created_at), "MMM d, yyyy")}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            asChild
                          >
                            <a href={`/facts/${relatedFact.uuid}`} target="_blank" rel="noopener noreferrer">
                              View
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No related facts found.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Metadata Tab */}
            <TabsContent value="metadata" className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Created</dt>
                      <dd className="font-medium">{format(new Date(fact.created_at), "MMM d, yyyy 'at' h:mm a")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Valid From</dt>
                      <dd className="font-medium">{format(new Date(fact.valid_at), "MMM d, yyyy")}</dd>
                    </div>
                    {fact.invalid_at && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Invalid From</dt>
                        <dd className="font-medium">{format(new Date(fact.invalid_at), "MMM d, yyyy")}</dd>
                      </div>
                    )}
                    {fact.expired_at && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Expired</dt>
                        <dd className="font-medium">{format(new Date(fact.expired_at), "MMM d, yyyy")}</dd>
                      </div>
                    )}
                    {fact.similarity_score != null && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Confidence Score</dt>
                        <dd className="font-mono">{fact.similarity_score.toFixed(3)}</dd>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div>
                      <dt className="text-muted-foreground mb-1">UUID</dt>
                      <dd className="font-mono text-xs break-all">{fact.uuid}</dd>
                    </div>
                    {fact.source_node_uuid && (
                      <div>
                        <dt className="text-muted-foreground mb-1">Source Node UUID</dt>
                        <dd className="font-mono text-xs break-all">{fact.source_node_uuid}</dd>
                      </div>
                    )}
                    {fact.target_node_uuid && (
                      <div>
                        <dt className="text-muted-foreground mb-1">Target Node UUID</dt>
                        <dd className="font-mono text-xs break-all">{fact.target_node_uuid}</dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
