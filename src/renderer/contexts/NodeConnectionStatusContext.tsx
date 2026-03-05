import React, { createContext, useContext, useMemo } from 'react';
import { useTabContext } from './TabContext';

export type NodeConnectionStatus = 'connected' | 'connecting' | 'error' | 'disconnected';

type StatusMap = Record<string, NodeConnectionStatus>;

const NodeConnectionStatusContext = createContext<StatusMap>({});

export const useNodeConnectionStatus = (nodeId: string): NodeConnectionStatus | undefined => {
  const map = useContext(NodeConnectionStatusContext);
  return map[nodeId];
};

export const NodeConnectionStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connections } = useTabContext();

  const statusMap = useMemo(() => {
    const map: StatusMap = {};
    for (const conn of connections) {
      if (!conn.nodeId) continue;
      const existing = map[conn.nodeId];
      // Priority: connected > connecting > error > disconnected
      if (!existing || statusPriority(conn.status) > statusPriority(existing)) {
        map[conn.nodeId] = conn.status;
      }
    }
    return map;
  }, [connections]);

  return (
    <NodeConnectionStatusContext.Provider value={statusMap}>
      {children}
    </NodeConnectionStatusContext.Provider>
  );
};

function statusPriority(status: NodeConnectionStatus): number {
  switch (status) {
    case 'connected': return 3;
    case 'connecting': return 2;
    case 'error': return 1;
    case 'disconnected': return 0;
  }
}
