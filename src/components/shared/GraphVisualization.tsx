import { useRef, useEffect, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods } from "react-force-graph-2d";
import * as d3 from "d3-force";

export interface ForceGraphNode {
  id: string;
  label: string;
  type: string;
  isCentered: boolean;
  size: number;
  color: string;
  apiNode: any; // Generic - will be GraphNode in practice
}

export interface ForceGraphLink {
  source: string;
  target: string;
  label: string;
  type: string;
  color: string;
  apiEdge: any; // Generic - will be GraphEdge in practice
}

interface GraphVisualizationProps {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
  onNodeClick?: (node: ForceGraphNode) => void;
  onLinkClick?: (link: ForceGraphLink) => void;
  width?: number;
  height?: number;
  centeredNodeId?: string;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
}

export function GraphVisualization({
  nodes,
  links,
  onNodeClick,
  onLinkClick,
  width = 800,
  height = 600,
  centeredNodeId,
  selectedNodeId,
  selectedEdgeId,
}: GraphVisualizationProps) {
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const lastCenteredId = useRef<string | null>(null);
  const fixedPositions = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );

  // Preserve fixed positions across renders
  useEffect(() => {
    // Reapply fixed positions to nodes that were manually positioned
    nodes.forEach((node: any) => {
      const fixed = fixedPositions.current.get(node.id);
      if (fixed) {
        node.fx = fixed.x;
        node.fy = fixed.y;
      }
    });
  }, [nodes]);

  // Configure D3 forces - radial layout with center node
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    // Link force - weak to allow radial positioning
    const linkForce = fg.d3Force("link");
    if (linkForce) {
      linkForce.distance?.(100); // Longer distance for radial layout
      linkForce.strength?.(0.1); // Very weak - let radial force dominate
    }

    // Charge force (repulsion) - strong to spread nodes apart
    const chargeForce = fg.d3Force("charge");
    if (chargeForce) {
      chargeForce.strength?.(-200); // Strong repulsion to space nodes evenly
      chargeForce.distanceMax?.(300);
    }

    // Collision force - prevent overlap
    fg.d3Force(
      "collision",
      d3
        .forceCollide()
        .radius((node: any) => node.size + 15)
        .strength(1.0) // Strong to prevent overlap
    );

    // Center force - disabled, radial handles centering
    fg.d3Force("center", null);

    // Radial force for centered node and connected nodes
    if (centeredNodeId) {
      fg.d3Force(
        "radial",
        d3
          .forceRadial(
            (node: any) => (node.id === centeredNodeId ? 0 : 120), // Centered at 0, others at 120px radius
            width / 2,
            height / 2
          )
          .strength((node: any) => (node.id === centeredNodeId ? 1.0 : 0.8))
      ); // Strong for both center and periphery
    }
  }, [width, height, centeredNodeId]);

  // Center viewport only when centered node ID actually changes
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !centeredNodeId) return;

    // Only center if this is a new centered node (not already centered)
    if (lastCenteredId.current === centeredNodeId) return;

    // Wait for simulation to complete, then center once
    const timer = setTimeout(() => {
      // Center on canvas center, adjusted left by 100px for proper centering
      fg.centerAt(width / 2 + 100, height / 2, 0); // 0 duration = instant
      fg.zoom(1.2, 0);
      lastCenteredId.current = centeredNodeId; // Remember we centered this node
    }, 150); // Wait for warmup to complete

    return () => clearTimeout(timer);
  }, [centeredNodeId, width, height]); // Check when centeredNodeId or dimensions change

  // Custom node rendering with selection state and always-visible labels
  const nodeCanvasObject = useCallback(
    (node: any, ctx: CanvasRenderingContext2D) => {
      const { x, y, size, color, label, isCentered, id } = node;
      const isSelected = id === selectedNodeId;

      // Draw selection ring for selected node
      if (isSelected && !isCentered) {
        ctx.beginPath();
        ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw glow for centered node
      if (isCentered) {
        ctx.beginPath();
        ctx.arc(x, y, size * 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = `${color}40`; // 25% opacity
        ctx.fill();
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();

      // Draw border
      ctx.strokeStyle = isCentered ? "#ffffff" : isSelected ? "#ffffff" : color;
      ctx.lineWidth = isCentered ? 2 : isSelected ? 2 : 1;
      ctx.stroke();

      // Draw label - ALWAYS show for all nodes
      const fontSize = isCentered ? 14 : 11;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isSelected ? "#facc15" : "#ffffff"; // Yellow for selected, white for others
      ctx.fillText(label, x, y + size + 12);
    },
    [selectedNodeId]
  );

  // Custom link rendering with selection state and always-visible labels
  const linkCanvasObject = useCallback(
    (link: any, ctx: CanvasRenderingContext2D) => {
      const { source, target, color, label, apiEdge } = link;
      const isSelected = apiEdge?.uuid === selectedEdgeId;

      // Draw curved line
      const curvature = 0.3;
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;

      // Calculate curve control point
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const controlX = midX + curvature * dy;
      const controlY = midY - curvature * dx;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
      ctx.strokeStyle = isSelected ? "#ffffff" : color;
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.stroke();

      // Draw arrow head at target
      const angle = Math.atan2(target.y - controlY, target.x - controlX);
      const arrowSize = isSelected ? 8 : 6;

      ctx.beginPath();
      ctx.moveTo(target.x, target.y);
      ctx.lineTo(
        target.x - arrowSize * Math.cos(angle - Math.PI / 6),
        target.y - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        target.x - arrowSize * Math.cos(angle + Math.PI / 6),
        target.y - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = isSelected ? "#ffffff" : color;
      ctx.fill();

      // Draw label - ALWAYS show for all edges
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Position label at curve midpoint
      const t = 0.5;
      const labelX =
        (1 - t) * (1 - t) * source.x +
        2 * (1 - t) * t * controlX +
        t * t * target.x;
      const labelY =
        (1 - t) * (1 - t) * source.y +
        2 * (1 - t) * t * controlY +
        t * t * target.y;

      // Draw background for label readability
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(labelX - textWidth / 2 - 4, labelY - 8, textWidth + 8, 16);

      // Draw label text
      ctx.fillStyle = isSelected ? "#facc15" : "#aaaaaa"; // Yellow for selected, gray for others
      ctx.fillText(label, labelX, labelY);
    },
    [selectedEdgeId]
  );

  // Wrapper functions to handle type casting
  const handleNodeClick = useCallback(
    (node: any) => {
      if (onNodeClick) {
        onNodeClick(node as ForceGraphNode);
      }
    },
    [onNodeClick]
  );

  const handleLinkClick = useCallback(
    (link: any) => {
      if (onLinkClick) {
        onLinkClick(link as ForceGraphLink);
      }
    },
    [onLinkClick]
  );

  // Fix node position after dragging and save to ref
  const handleNodeDragEnd = useCallback((node: any) => {
    node.fx = node.x;
    node.fy = node.y;
    // Save position to ref so it persists across re-renders
    fixedPositions.current.set(node.id, { x: node.x, y: node.y });
  }, []);

  // Paint full circle area for easier node clicking
  const nodePointerAreaPaint = useCallback(
    (node: any, color: string, ctx: CanvasRenderingContext2D) => {
      const { x, y, size } = node;

      // Draw full node circle for hit detection
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  // Paint wider invisible area for easier edge clicking
  const linkPointerAreaPaint = useCallback(
    (link: any, color: string, ctx: CanvasRenderingContext2D) => {
      const { source, target } = link;

      // Draw thicker invisible line for easier clicking
      const curvature = 0.3;
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const controlX = midX + curvature * dy;
      const controlY = midY - curvature * dx;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.quadraticCurveTo(controlX, controlY, target.x, target.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 10; // Thicker for easier clicking
      ctx.stroke();
    },
    []
  );

  return (
    <ForceGraph2D
      ref={fgRef as any}
      graphData={{ nodes: nodes as any, links: links as any }}
      width={width}
      height={height}
      nodeId="id"
      nodeLabel="label"
      nodeCanvasObject={nodeCanvasObject}
      nodePointerAreaPaint={nodePointerAreaPaint}
      linkCanvasObject={linkCanvasObject}
      linkPointerAreaPaint={linkPointerAreaPaint}
      onNodeClick={handleNodeClick}
      onLinkClick={handleLinkClick}
      onNodeDragEnd={handleNodeDragEnd}
      cooldownTicks={0}
      warmupTicks={100}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      enableNodeDrag={true}
    />
  );
}
