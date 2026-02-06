import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useGraphiti } from "@/context/GraphitiContext";
import { graphitiService } from "@/api/graphitiService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, Database, AlertTriangle, Pin, PinOff, Copy, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPinnedGraphs, pinGraph, unpinGraph, isGraphPinned } from "@/lib/graphStorage";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const GraphManagementDialog: React.FC<Props> = ({
  open,
  onOpenChange,
}) => {
  const { groupId, setGroupId } = useGraphiti();
  const queryClient = useQueryClient();
  const [newGraphId, setNewGraphId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmGraph, setDeleteConfirmGraph] = useState<string | null>(
    null
  );
  const [backupSourceGraph, setBackupSourceGraph] = useState<string | null>(null);
  const [backupTargetId, setBackupTargetId] = useState("");
  const [pinnedGraphs, setPinnedGraphsState] = useState<string[]>(() => getPinnedGraphs());

  // Fetch available graphs
  const { data: graphsData, isLoading } = useQuery({
    queryKey: ["graphs"],
    queryFn: () => graphitiService.listGroups(),
  });

  const graphs = graphsData?.groups || [];

  const handleCreateGraph = async () => {
    if (!newGraphId.trim()) {
      toast.error("Please enter a graph ID");
      return;
    }

    // Validate graph ID (alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9_-]+$/.test(newGraphId)) {
      toast.error("Graph ID can only contain letters, numbers, dashes, and underscores");
      return;
    }

    // Check if graph already exists
    if (graphs.some((g) => g.group_id === newGraphId)) {
      toast.error("A graph with this ID already exists");
      return;
    }

    setIsCreating(true);
    try {
      // Graphiti auto-creates groups on first use, so we just need to switch to it
      setGroupId(newGraphId);

      // Invalidate queries to refetch the updated list
      await queryClient.invalidateQueries({ queryKey: ["graphs"] });

      toast.success(`Created graph: ${newGraphId}`);
      setNewGraphId("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create graph");
      console.error("Create graph error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (graphIdToDelete: string) => graphitiService.deleteGroup(graphIdToDelete),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["graphs"] });
      toast.success(`Deleted graph: ${deleteConfirmGraph}`);
      setDeleteConfirmGraph(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete graph: ${(error as Error).message}`);
    },
  });

  const handleDeleteGraph = (graphIdToDelete: string) => {
    if (graphIdToDelete === groupId) {
      toast.error("Cannot delete the currently active graph. Switch to another graph first.");
      setDeleteConfirmGraph(null);
      return;
    }

    deleteMutation.mutate(graphIdToDelete);
  };

  const handleTogglePin = (graphId: string) => {
    const isPinned = pinnedGraphs.includes(graphId);
    if (isPinned) {
      unpinGraph(graphId);
      setPinnedGraphsState(pinnedGraphs.filter((id) => id !== graphId));
      toast.success(`Unpinned graph: ${graphId}`);
    } else {
      pinGraph(graphId);
      setPinnedGraphsState([...pinnedGraphs, graphId]);
      toast.success(`Pinned graph: ${graphId}`);
    }
  };

  const handleSwitchToGraph = (graphId: string) => {
    setGroupId(graphId);
    toast.success(`Switched to graph: ${graphId}`);
  };

  const backupMutation = useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: string; targetId: string }) =>
      graphitiService.backupGroup(sourceId, targetId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["graphs"] });
      setBackupSourceGraph(null);
      setBackupTargetId("");
    },
    onError: (error) => {
      toast.error(`Failed to backup graph: ${(error as Error).message}`);
    },
  });

  const handleBackupGraph = async () => {
    if (!backupSourceGraph || !backupTargetId.trim()) {
      toast.error("Please enter a target graph ID");
      return;
    }

    // Validate target graph ID
    if (!/^[a-zA-Z0-9_-]+$/.test(backupTargetId)) {
      toast.error("Graph ID can only contain letters, numbers, dashes, and underscores");
      return;
    }

    // Check if target already exists
    if (graphs.some((g) => g.group_id === backupTargetId)) {
      toast.error("A graph with this ID already exists");
      return;
    }

    backupMutation.mutate({ sourceId: backupSourceGraph, targetId: backupTargetId });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full h-full max-w-full max-h-full md:max-w-2xl md:max-h-[80vh] md:h-auto overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Manage Graphs</DialogTitle>
            <DialogDescription>
              Create new memory graphs or delete existing ones. Each graph is a separate knowledge base.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Create New Graph */}
            <div className="space-y-3">
              <Label htmlFor="new-graph">Create New Graph</Label>
              <div className="flex gap-2">
                <Input
                  id="new-graph"
                  placeholder="Enter graph ID (e.g., my-project)"
                  value={newGraphId}
                  onChange={(e) => setNewGraphId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateGraph();
                    }
                  }}
                />
                <Button
                  onClick={handleCreateGraph}
                  disabled={isCreating || !newGraphId.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Graph IDs can only contain letters, numbers, dashes, and underscores
              </p>
            </div>

            {/* Existing Graphs */}
            <div className="space-y-3">
              <Label>Existing Graphs ({graphs.length})</Label>
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading graphs...</div>
              ) : graphs.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No graphs found. Create your first graph above.
                </div>
              ) : (
                <div className="space-y-2">
                  {graphs.map((graph) => (
                    <div
                      key={graph.group_id}
                      className={`flex items-center justify-between p-3 border rounded-lg ${
                        graph.group_id === groupId
                          ? "bg-accent border-primary"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm flex items-center gap-2">
                            {graph.group_id}
                            {graph.group_id === groupId && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                Active
                              </span>
                            )}
                            {pinnedGraphs.includes(graph.group_id) && (
                              <Pin className="h-3 w-3 text-primary" fill="currentColor" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {graph.entity_count} entities • {graph.episode_count} episodes • {graph.fact_count} facts
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {graph.group_id !== groupId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSwitchToGraph(graph.group_id)}
                            title="Make this graph active"
                          >
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(graph.group_id)}
                          title={
                            pinnedGraphs.includes(graph.group_id)
                              ? "Unpin graph"
                              : "Pin graph"
                          }
                        >
                          {pinnedGraphs.includes(graph.group_id) ? (
                            <PinOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Pin className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setBackupSourceGraph(graph.group_id);
                            setBackupTargetId(`${graph.group_id}-backup-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`);
                          }}
                          title="Backup graph"
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmGraph(graph.group_id)}
                          disabled={graph.group_id === groupId}
                          title={
                            graph.group_id === groupId
                              ? "Cannot delete active graph"
                              : "Delete graph"
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteConfirmGraph !== null}
        onOpenChange={(open) => !open && setDeleteConfirmGraph(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Graph?
            </AlertDialogTitle>
            <div className="space-y-2">
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteConfirmGraph}</strong>?
              </AlertDialogDescription>
              <div className="text-sm text-destructive">
                This will permanently delete all entities, episodes, and facts in this graph. This action cannot be undone.
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                deleteConfirmGraph && handleDeleteGraph(deleteConfirmGraph);
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Graph"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Confirmation Dialog */}
      <AlertDialog
        open={backupSourceGraph !== null}
        onOpenChange={(open) => {
          if (!open) {
            setBackupSourceGraph(null);
            setBackupTargetId("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-primary" />
              Backup Graph
            </AlertDialogTitle>
            <div className="space-y-3">
              <AlertDialogDescription>
                Create a backup of <strong>{backupSourceGraph}</strong>
              </AlertDialogDescription>
              <div className="space-y-2">
                <Label htmlFor="backup-target-id">Target Graph ID</Label>
                <Input
                  id="backup-target-id"
                  placeholder="Enter backup graph ID"
                  value={backupTargetId}
                  onChange={(e) => setBackupTargetId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleBackupGraph();
                    }
                  }}
                />
                <div className="text-xs text-muted-foreground">
                  This will copy all entities, episodes, and facts to a new graph
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={backupMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleBackupGraph();
              }}
              disabled={backupMutation.isPending}
            >
              {backupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                "Create Backup"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
