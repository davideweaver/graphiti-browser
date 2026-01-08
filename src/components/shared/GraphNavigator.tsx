import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { graphitiService } from "@/api/graphitiService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, ArrowLeft, Layers, X } from "lucide-react";
import type { GraphNode as APIGraphNode, GraphEdge as APIGraphEdge, GraphConnection } from "@/types/graphiti";
import { GraphVisualization } from "./GraphVisualization";
import type { ForceGraphNode, ForceGraphLink } from "./GraphVisualization";

interface GraphNavigatorProps {
  nodeType: "fact" | "session" | "entity" | "episode" | "project";
  nodeId: string;
  groupId: string;
}

export function GraphNavigator({ nodeType, nodeId, groupId }: GraphNavigatorProps) {
  const [centeredNodeId, setCenteredNodeId] = useState<string>(nodeId);
  const [centeredNodeType, setCenteredNodeType] = useState<string>(nodeType);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(nodeId);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<{
    type: 'node' | 'edge';
    data: APIGraphNode | APIGraphEdge;
  } | null>(null);
  const [navigationHistory, setNavigationHistory] = useState<Array<{ id: string; type: string }>>([]);
  const [visibleNodeTypes, setVisibleNodeTypes] = useState<Set<string>>(
    new Set(['Entity', 'Episodic', 'Session', 'Project', 'Community'])
  );
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [depth, setDepth] = useState<number>(1);
  const [factEdgeId, setFactEdgeId] = useState<string | null>(null);

  // Reset centered and selected node when nodeId changes from parent
  useEffect(() => {
    console.log("GraphNavigator: nodeId prop changed to", nodeId);
    console.log("GraphNavigator: updating centeredNodeId and selectedNodeId to", nodeId);
    setCenteredNodeId(nodeId);
    setCenteredNodeType(nodeType);
    setSelectedNodeId(nodeId);
    // Clear fact edge ID when switching nodes
    setFactEdgeId(null);
  }, [nodeId, nodeType]);

  // Fetch connections using generic API (different endpoint for nodes vs edges/facts)
  const { data: connections, isLoading } = useQuery({
    queryKey: ["graph-connections", centeredNodeId, groupId, centeredNodeType, depth],
    queryFn: async () => {
      console.log("GraphNavigator: Fetching connections for centeredNodeId", centeredNodeId, "depth:", depth);

      // Helper to fetch single node connections
      const fetchNodeConnections = async (nodeId: string, nodeType: string) => {
        if (nodeType === "fact") {
          const edgeResult = await graphitiService.getEdgeConnections(nodeId, groupId);
          // Store fact edge ID for auto-selection
          setFactEdgeId(edgeResult.edge.uuid);
          // Use source node as center instead of creating virtual Fact node
          return {
            center_node: edgeResult.source,
            connections: [
              { node: edgeResult.target, relationship: edgeResult.edge, direction: "outgoing" as const },
            ],
          };
        }
        return await graphitiService.getNodeConnections(nodeId, groupId);
      };

      // Fetch multi-hop connections
      const allConnections = new Map<string, GraphConnection[]>();
      const allNodes = new Map<string, APIGraphNode>();
      const visited = new Set<string>();

      // Map for converting GraphNode types to query parameter types
      const nodeTypeMap: Record<string, string> = {
        Entity: "entity", Episodic: "episode", Session: "session",
        Project: "project", Community: "community",
      };

      // Start with centered node
      const centerResult = await fetchNodeConnections(centeredNodeId, centeredNodeType);
      const centerNode = centerResult.center_node;
      allNodes.set(centerNode.uuid, centerNode);

      // Resolve center node type for BFS traversal (facts become their source entity type)
      const resolvedCenterType = centeredNodeType === "fact"
        ? nodeTypeMap[centerNode.node_type] || "entity"
        : centeredNodeType;

      // BFS to fetch connections at each depth level
      let currentLevel = [{ id: centerNode.uuid, type: resolvedCenterType }];

      for (let level = 1; level <= depth; level++) {
        const nextLevel: Array<{ id: string; type: string }> = [];

        for (const { id, type } of currentLevel) {
          if (visited.has(id)) continue;
          visited.add(id);

          try {
            const result = await fetchNodeConnections(id, type);
            allConnections.set(id, result.connections);

            // Add connected nodes to next level
            result.connections.forEach((conn) => {
              allNodes.set(conn.node.uuid, conn.node);
              if (level < depth && conn.node.node_type !== "Fact") {
                // Skip Fact nodes - they're edges, not traversable nodes
                nextLevel.push({ id: conn.node.uuid, type: nodeTypeMap[conn.node.node_type] || "entity" });
              }
            });
          } catch (error) {
            console.error(`Failed to fetch connections for ${id}:`, error);
          }
        }

        currentLevel = nextLevel;
      }

      // Merge all connections into format expected by transformToForceGraph
      const mergedConnections: GraphConnection[] = [];
      allConnections.forEach((connections) => {
        mergedConnections.push(...connections);
      });

      return {
        center_node: centerNode,
        connections: mergedConnections,
        total_connections: mergedConnections.length,
      };
    },
    enabled: !!centeredNodeId,
    staleTime: 0,
    gcTime: 0,
  });

  // Auto-select fact edge when viewing a fact
  useEffect(() => {
    if (factEdgeId && connections) {
      // Find the edge in the links
      const factEdge = connections.connections.find(conn => conn.relationship.uuid === factEdgeId);
      if (factEdge) {
        setSelectedEdgeId(factEdgeId);
        setSelectedNodeId(null);
        setSelectedElement({ type: 'edge', data: factEdge.relationship });
      }
    }
  }, [factEdgeId, connections]);

  // Build visualization graph from generic connections
  const { nodes: allNodes, links: allLinks } = transformToForceGraph(connections?.center_node, connections?.connections || []);

  // Filter nodes and links based on visible node types
  const nodes = allNodes.filter(node => visibleNodeTypes.has(node.type));
  const nodeIds = new Set(nodes.map(n => n.id));
  const links = allLinks.filter(link =>
    nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
  );

  // Toggle node type visibility
  const toggleNodeType = (nodeType: string) => {
    setVisibleNodeTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeType)) {
        newSet.delete(nodeType);
      } else {
        newSet.add(nodeType);
      }
      return newSet;
    });
  };

  // Find the selected node (either center or a connected node)
  const selectedNode = selectedNodeId === connections?.center_node?.uuid
    ? connections?.center_node
    : connections?.connections.find((conn) => conn.node.uuid === selectedNodeId)?.node;

  console.log("GraphNavigator: Render state:", {
    nodeIdProp: nodeId,
    centeredNodeId,
    selectedNodeId,
    selectedEdgeId,
    centerNodeUuid: connections?.center_node?.uuid,
    centerNodeLabel: connections?.center_node?.label,
    selectedNodeUuid: selectedNode?.uuid,
    totalNodes: nodes.length,
    totalLinks: links.length,
    centeredNodeInGraph: nodes.find(n => n.isCentered)?.id
  });

  const handleNodeClick = (node: ForceGraphNode) => {
    // Clicking a node selects it for metadata display
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setSelectedElement({ type: 'node', data: node.apiNode });
  };

  const handleLinkClick = (link: ForceGraphLink) => {
    // Clicking an edge selects it for metadata display
    setSelectedEdgeId(link.apiEdge.uuid);
    setSelectedNodeId(null);
    setSelectedElement({ type: 'edge', data: link.apiEdge });
  };

  const handleOpenNode = () => {
    // Open button centers the selected node (kept for backward compatibility)
    if (selectedNodeId && selectedNodeId !== centeredNodeId && selectedNode) {
      const typeMap: Record<string, string> = {
        Entity: "entity",
        Episodic: "episode",
        Session: "session",
        Project: "project",
        Community: "community",
        Fact: "fact",
      };

      const newNodeType = typeMap[selectedNode.node_type] || "entity";

      console.log("GraphNavigator: Opening node", selectedNodeId, "with type", newNodeType);

      // Add current node to history before navigating
      setNavigationHistory(prev => [...prev, { id: centeredNodeId, type: centeredNodeType }]);

      setCenteredNodeId(selectedNodeId);
      setCenteredNodeType(newNodeType);
    }
  };

  const handleBack = () => {
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1)); // Remove last item
      setCenteredNodeId(previous.id);
      setCenteredNodeType(previous.type);
      setSelectedNodeId(previous.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!connections || !connections.center_node) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Network className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No relationship data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Graph Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="relative min-h-[400px] h-[600px] bg-muted/20 rounded-lg overflow-hidden">
            <GraphVisualization
              nodes={nodes}
              links={links}
              onNodeClick={handleNodeClick}
              onLinkClick={handleLinkClick}
              width={800}
              height={600}
              centeredNodeId={centeredNodeId}
              selectedNodeId={selectedNodeId}
              selectedEdgeId={selectedEdgeId}
            />
          </div>

          {/* Toolbar */}
          <div className="mt-4 flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBack}
                disabled={navigationHistory.length === 0}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenNode}
                disabled={!selectedNodeId || selectedNodeId === centeredNodeId}
              >
                Open
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Depth:</span>
                <Select value={depth.toString()} onValueChange={(val) => setDepth(parseInt(val))}>
                  <SelectTrigger className="h-9 w-[60px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Filter by Type</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFilterPopoverOpen(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {['Entity', 'Episodic', 'Session', 'Project', 'Community'].map((nodeType) => {
                        const color = getNodeColor(nodeType);
                        const isVisible = visibleNodeTypes.has(nodeType);
                        return (
                          <button
                            key={nodeType}
                            onClick={() => toggleNodeType(nodeType)}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent transition-colors text-left"
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2"
                              style={{
                                backgroundColor: isVisible ? color : 'transparent',
                                borderColor: color,
                                opacity: isVisible ? 1 : 0.3,
                              }}
                            />
                            <span className={`text-sm ${isVisible ? '' : 'text-muted-foreground'}`}>
                              {nodeType}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Element Details - Node or Edge */}
      {selectedElement && (
        <Card>
          <CardContent className="p-4">
            {selectedElement.type === 'node' ? (
              <NodeMetadataCard node={selectedElement.data as APIGraphNode} />
            ) : (
              <EdgeMetadataCard edge={selectedElement.data as APIGraphEdge} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Node metadata display component
function NodeMetadataCard({ node }: { node: APIGraphNode }) {
  return (
    <div className="space-y-3">
      <div className="pb-3 border-b space-y-2">
        <span className="font-semibold text-lg truncate block">{node.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {node.labels.map((labelText) => {
            const isNodeType = labelText === node.node_type;
            return (
              <Badge
                key={labelText}
                variant={isNodeType ? "default" : "secondary"}
                className="text-xs"
              >
                {labelText}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Display all metadata */}
      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-medium text-muted-foreground">UUID:</span>{" "}
          <span className="text-foreground font-mono">{node.uuid}</span>
        </div>

        {node.created_at && (
          <div className="text-xs">
            <span className="font-medium text-muted-foreground">Created:</span>{" "}
            <span className="text-foreground">
              {new Date(node.created_at).toLocaleString()}
            </span>
          </div>
        )}

        {Object.entries(node.metadata).map(([key, value]) => {
          // Skip internal fields, null/undefined, and embeddings
          if (
            key === "group_id" ||
            value === null ||
            value === undefined ||
            key.toLowerCase().includes("embedding")
          ) {
            return null;
          }

          // Handle different value types
          let displayValue: string;
          if (typeof value === "object") {
            displayValue = JSON.stringify(value, null, 2);
          } else if (typeof value === "boolean") {
            displayValue = value ? "Yes" : "No";
          } else if (key.includes("_at") || key.includes("timestamp")) {
            // Try to format as date
            try {
              displayValue = new Date(value).toLocaleString();
            } catch {
              displayValue = String(value);
            }
          } else {
            displayValue = String(value);
          }

          // Format key as readable label
          const label = key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return (
            <div key={key} className="text-sm">
              <span className="font-medium text-muted-foreground">{label}:</span>{" "}
              <span className={`text-foreground ${displayValue.length > 100 ? "block mt-1 text-xs" : ""}`}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Edge metadata display component
function EdgeMetadataCard({ edge }: { edge: APIGraphEdge }) {
  return (
    <div className="space-y-3">
      <div className="pb-3 border-b space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-lg truncate">{edge.label}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="default" className="text-xs">
            {edge.edge_type}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs">
          <span className="font-medium text-muted-foreground">UUID:</span>{" "}
          <span className="text-foreground font-mono">{edge.uuid}</span>
        </div>

        {edge.created_at && (
          <div className="text-xs">
            <span className="font-medium text-muted-foreground">Created:</span>{" "}
            <span className="text-foreground">
              {new Date(edge.created_at).toLocaleString()}
            </span>
          </div>
        )}

        {Object.entries(edge.metadata).map(([key, value]) => {
          // Skip internal fields, null/undefined, and embeddings
          if (
            key === "group_id" ||
            value === null ||
            value === undefined ||
            key.toLowerCase().includes("embedding")
          ) {
            return null;
          }

          // Handle different value types
          let displayValue: string;
          if (typeof value === "object") {
            displayValue = JSON.stringify(value, null, 2);
          } else if (typeof value === "boolean") {
            displayValue = value ? "Yes" : "No";
          } else if (key.includes("_at") || key.includes("timestamp")) {
            // Try to format as date
            try {
              displayValue = new Date(value).toLocaleString();
            } catch {
              displayValue = String(value);
            }
          } else {
            displayValue = String(value);
          }

          // Format key as readable label
          const label = key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

          return (
            <div key={key} className="text-sm">
              <span className="font-medium text-muted-foreground">{label}:</span>{" "}
              <span className={`text-foreground ${displayValue.length > 100 ? "block mt-1 text-xs" : ""}`}>
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper functions for styling
function calculateNodeSize(nodeType: string, degree: number): number {
  const baseSizes: Record<string, number> = {
    Entity: 8,
    Episodic: 8,
    Session: 8,
    Project: 10,
    Community: 12,
    Fact: 10,
  };
  return (baseSizes[nodeType] || 8) + Math.sqrt(degree) * 2;
}

function getNodeColor(nodeType: string): string {
  const colors: Record<string, string> = {
    Entity: '#6366f1',      // Indigo
    Episodic: '#10b981',    // Green
    Session: '#f59e0b',     // Amber
    Project: '#8b5cf6',     // Purple
    Community: '#ec4899',   // Pink
    Fact: '#f97316',        // Orange
  };
  return colors[nodeType] || '#6366f1';
}

function getEdgeColor(edgeType: string): string {
  const colors: Record<string, string> = {
    RELATES_TO: 'hsl(var(--border))',
    MENTIONS: 'hsl(var(--muted-foreground))',
    HAS_MEMBER: 'hsl(var(--primary))',
    IN_PROJECT: 'hsl(var(--secondary))',
    PART_OF_PROJECT: 'hsl(var(--secondary))',
  };
  return colors[edgeType] || 'hsl(var(--border))';
}

// Transform API data to force-graph format
function transformToForceGraph(
  centerNode: APIGraphNode | undefined,
  connections: GraphConnection[]
): { nodes: ForceGraphNode[]; links: ForceGraphLink[] } {
  if (!centerNode) {
    return { nodes: [], links: [] };
  }

  // Deduplicate nodes by UUID
  const nodeMap = new Map<string, ForceGraphNode>();

  // Add centered node
  nodeMap.set(centerNode.uuid, {
    id: centerNode.uuid,
    label: centerNode.label,
    type: centerNode.node_type,
    isCentered: true,
    size: calculateNodeSize(centerNode.node_type, connections.length),
    color: getNodeColor(centerNode.node_type),
    apiNode: centerNode,
  });

  // Add all connected nodes (deduplicated)
  connections.forEach((conn) => {
    if (!nodeMap.has(conn.node.uuid)) {
      nodeMap.set(conn.node.uuid, {
        id: conn.node.uuid,
        label: conn.node.label,
        type: conn.node.node_type,
        isCentered: false,
        size: calculateNodeSize(conn.node.node_type, 1),
        color: getNodeColor(conn.node.node_type),
        apiNode: conn.node,
      });
    }
  });

  // Create links using actual source/target UUIDs from relationships
  const links: ForceGraphLink[] = connections.map((conn) => ({
    source: conn.relationship.source_uuid,
    target: conn.relationship.target_uuid,
    label: conn.relationship.label,
    type: conn.relationship.edge_type,
    color: getEdgeColor(conn.relationship.edge_type),
    apiEdge: conn.relationship,
  }));

  return { nodes: Array.from(nodeMap.values()), links };
}
