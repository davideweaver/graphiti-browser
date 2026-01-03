import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/layout/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { FactCard } from "@/components/search/FactCard";
import type { Entity } from "@/types/graphiti";

export default function EntityDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const { groupId } = useGraphiti();
  const navigate = useNavigate();

  // Fetch the entity directly by UUID
  const { data: entity, isLoading: isLoadingEntity } = useQuery({
    queryKey: ["entity", uuid, groupId],
    queryFn: () => graphitiService.getEntity(uuid!, groupId),
    enabled: !!uuid,
  });

  // Search for facts mentioning this entity
  const { data: factsData, isLoading: isLoadingFacts } = useQuery({
    queryKey: ["entity-facts", entity?.name, groupId],
    queryFn: () =>
      graphitiService.search(entity!.name, groupId, 50),
    enabled: !!entity,
  });

  // Fetch related entities via relationships
  const { data: relationshipsData, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ["entity-relationships", uuid, groupId],
    queryFn: () => graphitiService.getEntityRelationships(uuid!, groupId),
    enabled: !!uuid,
  });

  const relatedEntities = relationshipsData?.entities || [];

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

  // Get entity type from labels array (skip generic "Entity" label)
  const entityType = useMemo(() => {
    if (!entity) return "Unknown";
    return entity.labels.find((label) => label !== "Entity") || entity.entity_type || "Unknown";
  }, [entity]);

  const isLoading = isLoadingEntity || isLoadingFacts || isLoadingRelationships;

  if (isLoadingEntity) {
    return (
      <Container title="Entity Detail" description="Loading...">
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

  if (!entity) {
    return (
      <Container title="Entity Not Found" description="The entity could not be found">
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2">Entity not found</h3>
              <p className="text-muted-foreground mb-4">
                The entity you're looking for doesn't exist or couldn't be loaded.
              </p>
              <Button onClick={() => navigate(-1)}>
                Back to Entities
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={entity.name}
      description={entityType}
      tools={
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Entity Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{entity.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className={getEntityTypeColor(entityType)}
                >
                  {entityType}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{entity.summary}</p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="facts">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="facts">
              Facts ({factsData?.facts.length || 0})
            </TabsTrigger>
            <TabsTrigger value="relationships">
              Relationships ({relatedEntities.length})
            </TabsTrigger>
          </TabsList>

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

            {!isLoadingFacts && factsData && factsData.facts.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No facts found for this entity
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoadingFacts && factsData && factsData.facts.length > 0 && (
              <div className="space-y-4">
                {factsData.facts.map((fact) => (
                  <FactCard key={fact.uuid} fact={fact} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Relationships Tab */}
          <TabsContent value="relationships" className="mt-6">
            {isLoadingRelationships && (
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

            {!isLoadingRelationships && relatedEntities.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    No related entities found
                  </p>
                </CardContent>
              </Card>
            )}

            {!isLoadingRelationships && relatedEntities.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedEntities.map((related) => {
                  const relatedType = related.labels.find((label) => label !== "Entity") || related.entity_type || "Unknown";
                  return (
                    <Card
                      key={related.uuid}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/entity/${related.uuid}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{related.name}</h3>
                          <Badge
                            variant="secondary"
                            className={getEntityTypeColor(relatedType)}
                          >
                            {relatedType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {related.summary}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
