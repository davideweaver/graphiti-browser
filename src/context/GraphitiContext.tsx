import { createContext, useState, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { initializeGraphSelection, setSelectedGraph as saveSelectedGraph } from "@/lib/graphStorage";

interface GraphitiContextType {
  baseUrl: string;
  groupId: string;
  setGroupId: (groupId: string) => void;
}

const GraphitiContext = createContext<GraphitiContextType | undefined>(
  undefined
);

export const GraphitiProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage (falls back to env var if needed)
  const [groupId, setGroupIdState] = useState(() => initializeGraphSelection());

  // Wrapper to also save to localStorage when changing graph
  const setGroupId = (newGroupId: string) => {
    saveSelectedGraph(newGroupId);
    setGroupIdState(newGroupId);
  };

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'graphiti-selected-graph' && e.newValue) {
        setGroupIdState(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <GraphitiContext.Provider
      value={{
        baseUrl: import.meta.env.VITE_GRAPHITI_SERVER || "http://localhost:8000",
        groupId,
        setGroupId,
      }}
    >
      {children}
    </GraphitiContext.Provider>
  );
};

export const useGraphiti = () => {
  const context = useContext(GraphitiContext);
  if (!context) {
    throw new Error("useGraphiti must be used within GraphitiProvider");
  }
  return context;
};
