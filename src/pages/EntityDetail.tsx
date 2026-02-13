import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { useGraphiti } from "@/context/GraphitiContext";
import Container from "@/components/container/Container";
import { ContainerToolButton } from "@/components/container/ContainerToolButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DestructiveConfirmationDialog from "@/components/dialogs/DestructiveConfirmationDialog";
import { ChevronLeft, Info, Edit, Trash2 } from "lucide-react";
import { FactCard } from "@/components/search/FactCard";
import { NodeDetailSheet } from "@/components/shared/NodeDetailSheet";
import type { Entity, Fact } from "@/types/graphiti";

export default function EntityDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const { groupId } = useGraphiti();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedSummary, setEditedSummary] = useState("");

  // Fact edit/delete state
  const [editFactDialogOpen, setEditFactDialogOpen] = useState(false);
  const [deleteFactDialogOpen, setDeleteFactDialogOpen] = useState(false);
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);
  const [editedFactText, setEditedFactText] = useState("");

  // Mutation for deleting entity (defined early so we can use isPending in queries)
  const deleteEntityMutation = useMutation({
    mutationFn: () => graphitiService.deleteEntity(uuid!, groupId),
    onSuccess: () => {
      // Remove all queries for this entity from cache before navigation
      // This prevents 404 errors when WebSocket event tries to invalidate/refetch
      queryClient.removeQueries({ queryKey: ["entity", uuid, groupId] });
      queryClient.removeQueries({ queryKey: ["entity-facts", uuid, groupId] });
      queryClient.removeQueries({ queryKey: ["entity-relationships", uuid, groupId] });

      // Navigate back to entities list
      navigate("/memory/entities");
    },
  });

  // Fetch the entity directly by UUID (disabled during deletion to prevent 404 errors)
  const { data: entity, isLoading: isLoadingEntity } = useQuery({
    queryKey: ["entity", uuid, groupId],
    queryFn: () => graphitiService.getEntity(uuid!, groupId),
    enabled: !!uuid && !deleteEntityMutation.isPending,
  });

  // Get facts structurally connected to this entity (disabled during deletion)
  const { data: factsData, isLoading: isLoadingFacts } = useQuery({
    queryKey: ["entity-facts", uuid, groupId],
    queryFn: () => graphitiService.getEntityFacts(uuid!, groupId, 50),
    enabled: !!uuid && !deleteEntityMutation.isPending,
  });

  // Fetch related entities via relationships (disabled during deletion)
  const { data: relationshipsData, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ["entity-relationships", uuid, groupId],
    queryFn: () => graphitiService.getEntityRelationships(uuid!, groupId),
    enabled: !!uuid && !deleteEntityMutation.isPending,
  });

  const relatedEntities = relationshipsData?.entities || [];

  // Mutation for updating entity
  const updateEntityMutation = useMutation({
    mutationFn: (updates: { name: string; summary: string }) =>
      graphitiService.updateEntity(uuid!, updates, groupId),
    onSuccess: () => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ["entity", uuid, groupId] });
      setEditDialogOpen(false);
    },
  });

  const handleOpenEditDialog = () => {
    if (entity) {
      setEditedName(entity.name);
      setEditedSummary(entity.summary);
      setEditDialogOpen(true);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditedName("");
    setEditedSummary("");
  };

  const handleSaveEdit = () => {
    if (editedName.trim()) {
      updateEntityMutation.mutate({
        name: editedName.trim(),
        summary: editedSummary.trim(),
      });
    }
  };

  const handleOpenDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteEntityMutation.mutate();
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
  };

  // Fact edit handlers
  const updateFactMutation = useMutation({
    mutationFn: ({ uuid, fact }: { uuid: string; fact: string }) =>
      graphitiService.updateFact(uuid, fact, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-facts", uuid, groupId] });
      setEditFactDialogOpen(false);
      setSelectedFact(null);
    },
  });

  const deleteFactMutation = useMutation({
    mutationFn: (factUuid: string) => graphitiService.deleteEntityEdge(factUuid, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-facts", uuid, groupId] });
      queryClient.invalidateQueries({ queryKey: ["entity-relationships", uuid, groupId] });
      setDeleteFactDialogOpen(false);
      setSelectedFact(null);
    },
  });

  const handleEditFact = (fact: Fact) => {
    setSelectedFact(fact);
    setEditedFactText(fact.fact);
    setEditFactDialogOpen(true);
  };

  const handleDeleteFact = (fact: Fact) => {
    setSelectedFact(fact);
    setDeleteFactDialogOpen(true);
  };

  const handleSaveFactEdit = () => {
    if (selectedFact && editedFactText.trim()) {
      updateFactMutation.mutate({
        uuid: selectedFact.uuid,
        fact: editedFactText.trim(),
      });
    }
  };

  const handleConfirmFactDelete = () => {
    if (selectedFact) {
      deleteFactMutation.mutate(selectedFact.uuid);
    }
  };

  const handleCancelFactDelete = () => {
    setDeleteFactDialogOpen(false);
    setSelectedFact(null);
  };

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

  if (!entity) {
    return (
      <Container title="Entity Not Found" description="The entity could not be found">
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
      </Container>
    );
  }

  return (
    <Container
      title="Entities"
      description="View entity information, relationships, and facts"
      tools={
        <div className="flex gap-2">
          <ContainerToolButton size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </ContainerToolButton>
          <ContainerToolButton size="sm" onClick={() => setSheetOpen(true)}>
            <Info className="h-4 w-4 mr-2" />
            Info
          </ContainerToolButton>
          <ContainerToolButton
            onClick={handleOpenDeleteDialog}
            disabled={deleteEntityMutation.isPending}
            size="icon"
            variant="destructive"
          >
            <Trash2 className="h-4 w-4" />
          </ContainerToolButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Entity Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 group">
                  <CardTitle className="text-2xl">{entity.name}</CardTitle>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleOpenEditDialog}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
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
        <Tabs defaultValue="relationships">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="relationships">
              Relationships ({relatedEntities.length})
            </TabsTrigger>
            <TabsTrigger value="facts">
              Facts ({factsData?.facts.length || 0})
            </TabsTrigger>
          </TabsList>

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
                      onClick={() => navigate(`/memory/entity/${related.uuid}`)}
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
              <div className="space-y-2">
                {factsData.facts.map((fact) => (
                  <FactCard
                    key={fact.uuid}
                    fact={fact}
                    onEdit={handleEditFact}
                    onConfirm={handleDeleteFact}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Entity Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              Update the entity name and summary. Changes will be saved to the knowledge graph.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Entity name"
                disabled={updateEntityMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                placeholder="Entity summary"
                rows={6}
                disabled={updateEntityMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={updateEntityMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateEntityMutation.isPending || !editedName.trim()}
            >
              {updateEntityMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Fact Dialog */}
      <Dialog open={editFactDialogOpen} onOpenChange={setEditFactDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Fact</DialogTitle>
            <DialogDescription>
              Update the fact text. This will modify the relationship in the knowledge graph.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fact-text">Fact</Label>
              <Textarea
                id="fact-text"
                value={editedFactText}
                onChange={(e) => setEditedFactText(e.target.value)}
                placeholder="Fact text"
                rows={4}
                disabled={updateFactMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditFactDialogOpen(false)}
              disabled={updateFactMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveFactEdit}
              disabled={updateFactMutation.isPending || !editedFactText.trim()}
            >
              {updateFactMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fact Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={deleteFactDialogOpen}
        onOpenChange={setDeleteFactDialogOpen}
        onConfirm={handleConfirmFactDelete}
        onCancel={handleCancelFactDelete}
        title="Delete Fact"
        description={`Are you sure you want to delete this fact?\n\n${selectedFact?.fact || ''}\n\nThis action cannot be undone.`}
      />

      {/* Delete Entity Confirmation Dialog */}
      <DestructiveConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Entity"
        description={`Are you sure you want to delete "${entity?.name}"? This will permanently remove the entity and all of its relationships from the knowledge graph. This action cannot be undone.`}
      />

      {/* NodeDetailSheet for graph navigation */}
      <NodeDetailSheet
        nodeType="entity"
        nodeId={uuid || null}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Container>
  );
}
