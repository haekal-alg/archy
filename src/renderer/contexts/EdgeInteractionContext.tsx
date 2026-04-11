import React, { createContext, useContext } from 'react';

export interface EdgeInteractionContextValue {
  onWaypointDragStart: (edgeId: string, waypointIndex: number, e: React.MouseEvent) => void;
  onEdgePathClick: (edgeId: string, e: React.MouseEvent) => void;
  onWaypointDoubleClick: (edgeId: string, waypointIndex: number) => void;
}

const EdgeInteractionContext = createContext<EdgeInteractionContextValue | null>(null);

export const EdgeInteractionProvider: React.FC<{
  value: EdgeInteractionContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => (
  <EdgeInteractionContext.Provider value={value}>
    {children}
  </EdgeInteractionContext.Provider>
);

export function useEdgeInteractionContext(): EdgeInteractionContextValue | null {
  return useContext(EdgeInteractionContext);
}
