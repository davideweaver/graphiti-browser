/**
 * localStorage utility for managing graph (group_id) selection and pinned graphs
 *
 * Replaces the VITE_GROUP_ID environment variable with persistent client-side storage.
 */

const STORAGE_KEY = 'graphiti-selected-graph';
const PINNED_GRAPHS_KEY = 'graphiti-pinned-graphs';

export interface GraphInfo {
  group_id: string;
  entity_count?: number;
  episode_count?: number;
  fact_count?: number;
}

/**
 * Get the currently selected graph ID from localStorage
 * @returns The selected graph ID or null if not set
 */
export function getSelectedGraph(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to read selected graph from localStorage:', error);
    return null;
  }
}

/**
 * Set the currently selected graph ID in localStorage
 * @param groupId - The graph ID to select
 */
export function setSelectedGraph(groupId: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, groupId);
  } catch (error) {
    console.error('Failed to save selected graph to localStorage:', error);
  }
}

/**
 * Clear the selected graph from localStorage
 */
export function clearSelectedGraph(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear selected graph from localStorage:', error);
  }
}

/**
 * Get the default graph ID (from environment variable or fallback)
 * @returns The default graph ID
 */
export function getDefaultGraph(): string {
  // Check for environment variable first (for backward compatibility during migration)
  const envGraphId = import.meta.env.VITE_GROUP_ID;
  if (envGraphId) {
    return envGraphId;
  }

  // Fallback to a default value if no environment variable is set
  return 'default';
}

/**
 * Initialize graph selection on app startup
 * @returns The graph ID to use
 */
export function initializeGraphSelection(): string {
  // Try to get from localStorage first
  const stored = getSelectedGraph();
  if (stored) {
    return stored;
  }

  // Fall back to default and save it
  const defaultGraph = getDefaultGraph();
  setSelectedGraph(defaultGraph);
  return defaultGraph;
}

/**
 * Get the list of pinned graph IDs from localStorage
 * @returns Array of pinned graph IDs
 */
export function getPinnedGraphs(): string[] {
  try {
    const stored = localStorage.getItem(PINNED_GRAPHS_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to read pinned graphs from localStorage:', error);
    return [];
  }
}

/**
 * Set the list of pinned graph IDs in localStorage
 * @param graphIds - Array of graph IDs to pin
 */
export function setPinnedGraphs(graphIds: string[]): void {
  try {
    localStorage.setItem(PINNED_GRAPHS_KEY, JSON.stringify(graphIds));
  } catch (error) {
    console.error('Failed to save pinned graphs to localStorage:', error);
  }
}

/**
 * Pin a graph
 * @param graphId - The graph ID to pin
 */
export function pinGraph(graphId: string): void {
  const pinned = getPinnedGraphs();
  if (!pinned.includes(graphId)) {
    setPinnedGraphs([...pinned, graphId]);
  }
}

/**
 * Unpin a graph
 * @param graphId - The graph ID to unpin
 */
export function unpinGraph(graphId: string): void {
  const pinned = getPinnedGraphs();
  setPinnedGraphs(pinned.filter((id) => id !== graphId));
}

/**
 * Check if a graph is pinned
 * @param graphId - The graph ID to check
 * @returns True if the graph is pinned
 */
export function isGraphPinned(graphId: string): boolean {
  return getPinnedGraphs().includes(graphId);
}
