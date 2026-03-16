import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { EnhancedDeviceData } from './EnhancedDeviceNode';
import { DynamicIcon, GenericIcon } from './NetworkIcons';
import { getIconByDeviceType } from '../iconStore';
import theme from '../../theme';

interface CommandPaletteProps {
  nodes: Node[];
  onFocusNode: (nodeId: string) => void;
  onConnectSSH: (node: Node) => void;
  onConnectRDP: (node: Node) => void;
  onClose: () => void;
}

interface ActionItem {
  label: string;
  icon: string;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  nodes,
  onFocusNode,
  onConnectSSH,
  onConnectRDP,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [actionNode, setActionNode] = useState<Node | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter enhanced nodes by query
  const filteredNodes = useMemo(() => {
    const enhancedNodes = nodes.filter((n) => n.type === 'enhanced');
    if (!query.trim()) return enhancedNodes;

    const q = query.toLowerCase();
    return enhancedNodes.filter((n) => {
      const data = n.data as unknown as EnhancedDeviceData;
      return (
        data.label?.toLowerCase().includes(q) ||
        data.type?.toLowerCase().includes(q) ||
        data.ipAddress?.toLowerCase().includes(q) ||
        data.host?.toLowerCase().includes(q) ||
        data.description?.toLowerCase().includes(q)
      );
    });
  }, [nodes, query]);

  // Actions for selected node
  const actions = useMemo((): ActionItem[] => {
    if (!actionNode) return [];
    const data = actionNode.data as unknown as EnhancedDeviceData;
    const items: ActionItem[] = [
      {
        label: 'Show in Design',
        icon: 'focus',
        action: () => {
          onFocusNode(actionNode.id);
          onClose();
        },
      },
    ];

    // Only show SSH if there's connection info
    if (data.host) {
      items.push({
        label: 'Connect SSH',
        icon: 'ssh',
        action: () => {
          onConnectSSH(actionNode);
          onClose();
        },
      });
      items.push({
        label: 'Connect RDP',
        icon: 'rdp',
        action: () => {
          onConnectRDP(actionNode);
          onClose();
        },
      });
    }

    return items;
  }, [actionNode, onFocusNode, onConnectSSH, onConnectRDP, onClose]);

  const currentItems = actionNode ? actions : filteredNodes;
  const maxIndex = currentItems.length - 1;

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, actionNode]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (actionNode) {
          setActionNode(null);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, maxIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (actionNode) {
          actions[selectedIndex]?.action();
        } else if (filteredNodes[selectedIndex]) {
          setActionNode(filteredNodes[selectedIndex]);
        }
      } else if (e.key === 'Backspace' && query === '' && actionNode) {
        e.preventDefault();
        setActionNode(null);
      }
    },
    [maxIndex, actionNode, actions, filteredNodes, selectedIndex, query, onClose]
  );

  const renderNodeIcon = (node: Node) => {
    const data = node.data as unknown as EnhancedDeviceData;
    if (data.customIconBase64) {
      return (
        <img
          src={data.customIconBase64}
          alt=""
          width={20}
          height={20}
          style={{ objectFit: 'contain' }}
        />
      );
    }
    const loaded = getIconByDeviceType(data.type);
    if (loaded) {
      return <img src={loaded.image} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />;
    }
    return <GenericIcon size={20} />;
  };

  const renderActionIcon = (icon: string) => {
    switch (icon) {
      case 'focus':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        );
      case 'ssh':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        );
      case 'rdp':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 10000,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        style={{
          width: 520,
          maxHeight: '60vh',
          backgroundColor: '#151923',
          border: '1px solid #2d3548',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #2d3548' }}>
          {actionNode && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                backgroundColor: '#1e2a4a',
                borderRadius: 4,
                marginRight: 8,
                fontSize: 12,
                color: '#6b9aff',
                whiteSpace: 'nowrap',
              }}
            >
              {renderNodeIcon(actionNode)}
              <span>{(actionNode.data as unknown as EnhancedDeviceData).label}</span>
            </div>
          )}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginRight: 8 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={actionNode ? 'Select action...' : 'Search devices...'}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#e0e4ec',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          />
          <kbd
            style={{
              padding: '2px 6px',
              backgroundColor: '#111827',
              border: '1px solid #2d3548',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'monospace',
              color: '#6b7280',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {actionNode
            ? actions.map((action, i) => (
                <div
                  key={action.label}
                  onClick={() => action.action()}
                  onMouseEnter={() => setSelectedIndex(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 16px',
                    cursor: 'pointer',
                    backgroundColor: i === selectedIndex ? '#1e2a4a' : 'transparent',
                    color: i === selectedIndex ? '#e0e4ec' : '#8892a6',
                    transition: 'background-color 0.1s',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', width: 20, justifyContent: 'center' }}>
                    {renderActionIcon(action.icon)}
                  </span>
                  <span style={{ fontSize: 13 }}>{action.label}</span>
                </div>
              ))
            : filteredNodes.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
                  No devices found
                </div>
              ) : (
                filteredNodes.map((node, i) => {
                  const data = node.data as unknown as EnhancedDeviceData;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setActionNode(node)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        backgroundColor: i === selectedIndex ? '#1e2a4a' : 'transparent',
                        transition: 'background-color 0.1s',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', width: 24, justifyContent: 'center' }}>
                        {renderNodeIcon(node)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          color: i === selectedIndex ? '#e0e4ec' : '#c9cdd5',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {data.label}
                        </div>
                        <div style={{
                          fontSize: 11,
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {[data.type, data.ipAddress || data.host].filter(Boolean).join(' \u00b7 ')}
                        </div>
                      </div>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#4d5565"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  );
                })
              )}
        </div>

        {/* Footer hint */}
        <div
          style={{
            padding: '6px 16px',
            borderTop: '1px solid #2d3548',
            display: 'flex',
            gap: 16,
            fontSize: 11,
            color: '#4d5565',
          }}
        >
          <span><kbd style={kbdMini}>&uarr;&darr;</kbd> navigate</span>
          <span><kbd style={kbdMini}>Enter</kbd> select</span>
          <span><kbd style={kbdMini}>Esc</kbd> {actionNode ? 'back' : 'close'}</span>
        </div>
      </div>
    </div>
  );
};

const kbdMini: React.CSSProperties = {
  padding: '1px 4px',
  backgroundColor: '#111827',
  border: '1px solid #2d3548',
  borderRadius: 3,
  fontSize: 10,
  fontFamily: 'monospace',
  color: '#6b7280',
};

export default CommandPalette;
