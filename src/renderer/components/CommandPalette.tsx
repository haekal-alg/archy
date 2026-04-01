import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { EnhancedDeviceData } from './EnhancedDeviceNode';
import { GenericIcon } from './NetworkIcons';
import { getIconByDeviceType } from '../iconStore';

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

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'network', label: 'Network', types: ['router', 'switch', 'firewall'] },
  { id: 'compute', label: 'Compute', types: ['server', 'desktop', 'laptop', 'linux', 'windows', 'mobile'] },
  { id: 'cloud', label: 'Cloud', types: ['cloud', 'cloud2', 'database'] },
  { id: 'security', label: 'Security', types: ['attacker'] },
];

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
  const [activeCategory, setActiveCategory] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter enhanced nodes by query and category
  const filteredNodes = useMemo(() => {
    const enhancedNodes = nodes.filter((n) => n.type === 'enhanced');

    let filtered = enhancedNodes;

    // Apply category filter
    if (activeCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === activeCategory);
      if (cat?.types) {
        filtered = filtered.filter((n) => {
          const data = n.data as unknown as EnhancedDeviceData;
          return cat.types!.includes(data.type);
        });
      }
    }

    // Apply text search
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter((n) => {
        const data = n.data as unknown as EnhancedDeviceData;
        return (
          data.label?.toLowerCase().includes(q) ||
          data.type?.toLowerCase().includes(q) ||
          data.ipAddress?.toLowerCase().includes(q) ||
          data.host?.toLowerCase().includes(q) ||
          data.description?.toLowerCase().includes(q)
        );
      });
    }

    return filtered;
  }, [nodes, query, activeCategory]);

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
  }, [query, actionNode, activeCategory]);

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
    const color = 'currentColor';
    switch (icon) {
      case 'focus':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        );
      case 'ssh':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        );
      case 'rdp':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '14vh',
        zIndex: 10000,
        fontFamily: FONT_STACK,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Glassmorphism panel */}
      <div
        style={{
          width: 580,
          maxHeight: '60vh',
          backgroundColor: 'rgba(25, 30, 42, 0.82)',
          backdropFilter: 'blur(40px) saturate(150%)',
          WebkitBackdropFilter: 'blur(40px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 0 0.5px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search input area */}
        <div style={{ padding: '14px 16px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 12,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Action mode: device chip */}
            {actionNode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px 4px 6px',
                  backgroundColor: 'rgba(77, 124, 254, 0.15)',
                  border: '1px solid rgba(77, 124, 254, 0.25)',
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#8fb4ff',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', width: 16, height: 16 }}>
                  {renderNodeIcon(actionNode)}
                </span>
                <span>{(actionNode.data as unknown as EnhancedDeviceData).label}</span>
              </div>
            )}

            {/* Magnifying glass */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5a6375"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>

            {/* Input */}
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
                color: '#e8ecf4',
                fontSize: 15,
                fontWeight: 400,
                fontFamily: FONT_STACK,
                letterSpacing: '-0.01em',
              }}
            />

            {/* ESC badge */}
            <kbd
              style={{
                padding: '3px 7px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 6,
                fontSize: 10,
                fontWeight: 500,
                fontFamily: FONT_STACK,
                color: '#5a6375',
                lineHeight: 1,
              }}
            >
              ESC
            </kbd>
          </div>
        </div>

        {/* Category chips (only in device list mode) */}
        {!actionNode && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '0 16px 10px',
              overflowX: 'auto',
            }}
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 9999,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: FONT_STACK,
                  letterSpacing: '0.01em',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  backgroundColor: activeCategory === cat.id
                    ? 'rgba(77, 124, 254, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: activeCategory === cat.id
                    ? '#8fb4ff'
                    : '#6b7280',
                  ...(activeCategory === cat.id
                    ? { boxShadow: 'inset 0 0 0 1px rgba(77, 124, 254, 0.3)' }
                    : {}),
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Separator */}
        <div style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '0 16px' }} />

        {/* Results list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 8px',
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
                    gap: 12,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderRadius: 10,
                    position: 'relative',
                    backgroundColor: i === selectedIndex ? 'rgba(77, 124, 254, 0.12)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  {/* Accent bar */}
                  {i === selectedIndex && (
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 20,
                      borderRadius: 3,
                      backgroundColor: '#4d7cfe',
                    }} />
                  )}

                  {/* Action icon container */}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: i === selectedIndex ? '#8fb4ff' : '#6b7280',
                      flexShrink: 0,
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {renderActionIcon(action.icon)}
                  </span>

                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: i === selectedIndex ? '#e8ecf4' : '#b4bcc9',
                    transition: 'color 0.15s ease',
                  }}>
                    {action.label}
                  </span>
                </div>
              ))
            : filteredNodes.length === 0 ? (
                <div style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  color: '#5a6375',
                  fontSize: 13,
                  fontWeight: 400,
                }}>
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
                        gap: 12,
                        padding: '9px 12px',
                        cursor: 'pointer',
                        borderRadius: 10,
                        position: 'relative',
                        backgroundColor: i === selectedIndex ? 'rgba(77, 124, 254, 0.12)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Accent bar */}
                      {i === selectedIndex && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: 20,
                          borderRadius: 3,
                          backgroundColor: '#4d7cfe',
                        }} />
                      )}

                      {/* Device icon container */}
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          flexShrink: 0,
                        }}
                      >
                        {renderNodeIcon(node)}
                      </span>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: i === selectedIndex ? '#e8ecf4' : '#c9cdd5',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          transition: 'color 0.15s ease',
                          letterSpacing: '-0.01em',
                        }}>
                          {data.label}
                        </div>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 400,
                          color: '#5a6375',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 1,
                        }}>
                          {[data.type, data.ipAddress || data.host].filter(Boolean).join(' \u00b7 ')}
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={i === selectedIndex ? '#5a6375' : '#3a4556'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ flexShrink: 0, transition: 'stroke 0.15s ease' }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  );
                })
              )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            gap: 16,
            fontSize: 11,
            fontWeight: 400,
            color: '#4d5565',
          }}
        >
          <span><kbd style={kbdStyle}>&uarr;&darr;</kbd> navigate</span>
          <span><kbd style={kbdStyle}>Enter</kbd> select</span>
          <span><kbd style={kbdStyle}>Esc</kbd> {actionNode ? 'back' : 'close'}</span>
        </div>
      </div>
    </div>
  );
};

const kbdStyle: React.CSSProperties = {
  padding: '2px 5px',
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 4,
  fontSize: 10,
  fontWeight: 500,
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
  color: '#5a6375',
};

export default CommandPalette;
