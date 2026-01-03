import { createContext, useState, useContext } from "react";
import type { ReactNode } from "react";

interface GraphitiContextType {
  baseUrl: string;
  groupId: string;
  setGroupId: (groupId: string) => void;
}

const GraphitiContext = createContext<GraphitiContextType | undefined>(
  undefined
);

export const GraphitiProvider = ({ children }: { children: ReactNode }) => {
  const [groupId, setGroupId] = useState(import.meta.env.VITE_GROUP_ID);

  return (
    <GraphitiContext.Provider
      value={{
        baseUrl: "http://localhost:8000",
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
