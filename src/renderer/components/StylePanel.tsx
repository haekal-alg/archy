import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { EnhancedDeviceData } from './EnhancedDeviceNode';
import { GroupNodeData } from './GroupNode';
import { TextNodeData } from './TextNode';
import { PencilIcon, ChevronLeftIcon, ChevronRightIcon } from './StatusIcons';
import ConnectionConfigPanel from './ConnectionConfigPanel';
import theme from '../../theme';

interface StylePanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, data: Partial<EnhancedDeviceData | GroupNodeData | TextNodeData>) => void;
  onUpdateEdge: (edgeId: string, data: any) => void;
  onMoveToFront?: (nodeId: string) => void;
  onMoveToBack?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Collapsible section for organizing panel fields
const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.sm} 0`,
          background: 'none',
          border: 'none',
          borderBottom: `1px solid ${theme.border.subtle}`,
          color: theme.text.secondary,
          fontSize: theme.fontSize.sm,
          fontWeight: theme.fontWeight.semibold,
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: theme.spacing.md,
        }}
      >
        <span style={{
          fontSize: theme.fontSize.xs,
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}>▾</span>
        {title}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
};

const StylePanel: React.FC<StylePanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onMoveToFront,
  onMoveToBack,
  onDeleteNode,
  onDeleteEdge,
  isOpen,
  onToggle
}) => {
  // Helper function to convert hex + opacity to rgba
  const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
  };

  // Shared style constants to reduce inline duplication
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.text.secondary,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    border: `1px solid ${theme.border.default}`,
    borderRadius: theme.radius.sm,
    background: theme.background.tertiary,
    color: theme.text.primary,
    fontSize: theme.fontSize.sm,
    boxSizing: 'border-box',
  };

  const colorInputStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    border: `1px solid ${theme.border.default}`,
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    background: theme.background.tertiary,
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: theme.spacing.lg,
  };

  const [activeTab, setActiveTab] = useState<'connection' | 'property'>('connection');
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#1976d2');
  const [nodeBgColor, setNodeBgColor] = useState('#ffb3ba40');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeOS, setNodeOS] = useState('');
  const [textFontSize, setTextFontSize] = useState(14);
  const [textFontColor, setTextFontColor] = useState('#000000');
  const [textBgColor, setTextBgColor] = useState('transparent');
  const [textBorderColor, setTextBorderColor] = useState('#000000');
  const [textBorderStyle, setTextBorderStyle] = useState<'solid' | 'dashed' | 'dotted' | 'none'>('none');
  const [textBorderWidth, setTextBorderWidth] = useState(1);
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeColor, setEdgeColor] = useState('#000000');
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [edgeRouting, setEdgeRouting] = useState<'bezier' | 'smoothstep' | 'straight'>('bezier');
  const [edgeAnimated, setEdgeAnimated] = useState(false);
  const [edgeMarkerStart, setEdgeMarkerStart] = useState<string>('none');
  const [edgeMarkerEnd, setEdgeMarkerEnd] = useState<string>('arrow');

  // Background opacity and transparency controls
  const [textBgOpacity, setTextBgOpacity] = useState(100);
  const [textBgTransparent, setTextBgTransparent] = useState(false);
  const [nodeBgOpacity, setNodeBgOpacity] = useState(100);
  const [nodeBgTransparent, setNodeBgTransparent] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      // Set default tab to 'connection' for device/group nodes
      if (selectedNode.type !== 'text') {
        setActiveTab('connection');
      }

      const data = selectedNode.data as unknown as EnhancedDeviceData | GroupNodeData | TextNodeData;
      setNodeLabel(data.label || '');

      if (selectedNode.type === 'text') {
        const textData = data as TextNodeData;
        setTextFontSize(textData.fontSize || 14);
        setTextFontColor(textData.fontColor || '#000000');

        // Parse background color for opacity and transparency
        const bgColor = textData.backgroundColor || 'transparent';
        if (bgColor === 'transparent') {
          setTextBgColor('#ffffff');
          setTextBgTransparent(true);
          setTextBgOpacity(100);
        } else if (bgColor.startsWith('rgba')) {
          // Parse rgba format
          const match = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            setTextBgColor(`#${r}${g}${b}`);
            setTextBgOpacity(Math.round(parseFloat(match[4]) * 100));
            setTextBgTransparent(false);
          }
        } else {
          setTextBgColor(bgColor);
          setTextBgOpacity(100);
          setTextBgTransparent(false);
        }

        setTextBorderColor(textData.borderColor || '#000000');
        setTextBorderStyle(textData.borderStyle || 'none');
        setTextBorderWidth(textData.borderWidth || 1);
      } else if (selectedNode.type === 'group') {
        // Group/Network Zone specific
        const groupData = data as GroupNodeData;
        setNodeColor(groupData.borderColor || '#ff6b6b');

        // Parse background color for opacity and transparency
        const bgColor = groupData.backgroundColor || '#ffb3ba40';
        if (bgColor === 'transparent') {
          setNodeBgColor('#ffb3ba');
          setNodeBgTransparent(true);
          setNodeBgOpacity(100);
        } else if (bgColor.startsWith('rgba')) {
          // Parse rgba format
          const match = bgColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
          if (match) {
            const r = parseInt(match[1]).toString(16).padStart(2, '0');
            const g = parseInt(match[2]).toString(16).padStart(2, '0');
            const b = parseInt(match[3]).toString(16).padStart(2, '0');
            setNodeBgColor(`#${r}${g}${b}`);
            setNodeBgOpacity(Math.round(parseFloat(match[4]) * 100));
            setNodeBgTransparent(false);
          }
        } else if (bgColor.startsWith('#') && bgColor.length === 9) {
          // Parse hex with alpha channel (e.g., #ffb3ba40)
          setNodeBgColor(bgColor.substring(0, 7));
          const alpha = parseInt(bgColor.substring(7, 9), 16);
          setNodeBgOpacity(Math.round((alpha / 255) * 100));
          setNodeBgTransparent(false);
        } else {
          setNodeBgColor(bgColor);
          setNodeBgOpacity(100);
          setNodeBgTransparent(false);
        }

        setNodeDescription(groupData.description || '');
      } else {
        // Enhanced device node
        setNodeColor((data as any).color || '#1976d2');
        setNodeDescription((data as any).description || '');
        setNodeOS((data as EnhancedDeviceData).operatingSystem || '');
      }
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      const data = selectedEdge.data || {};
      const style: any = selectedEdge.style || {};
      setEdgeLabel((selectedEdge as any).label || '');
      setEdgeColor(style.stroke || data.customColor || '#ffffff');

      // Read line style from strokeDasharray
      const dasharray = style.strokeDasharray;
      let lineStyle: 'solid' | 'dashed' | 'dotted' = 'solid';
      if (dasharray === '5 5') lineStyle = 'dashed';
      else if (dasharray === '1 3') lineStyle = 'dotted';
      else if (data.lineStyle && (data.lineStyle === 'solid' || data.lineStyle === 'dashed' || data.lineStyle === 'dotted')) {
        lineStyle = data.lineStyle;
      }
      setEdgeStyle(lineStyle);

      const routing = data.routingType;
      setEdgeRouting(
        routing === 'bezier' || routing === 'smoothstep' || routing === 'straight'
          ? routing
          : 'bezier'
      );
      setEdgeAnimated(selectedEdge.animated || false);
      setEdgeMarkerStart(typeof data.markerStart === 'string' ? data.markerStart : 'none'); // Read from edge data
      setEdgeMarkerEnd(typeof data.markerEnd === 'string' ? data.markerEnd : 'arrow'); // Read from edge data
    }
  }, [selectedEdge]);

  const handleNodeUpdate = () => {
    if (selectedNode) {
      const updates: any = {
        label: nodeLabel
      };

      if (selectedNode.type === 'text') {
        updates.fontSize = textFontSize;
        updates.fontColor = textFontColor;
        // Set background color based on transparent flag and opacity
        updates.backgroundColor = textBgTransparent
          ? 'transparent'
          : hexToRgba(textBgColor, textBgOpacity);
        updates.borderColor = textBorderColor;
        updates.borderStyle = textBorderStyle;
        updates.borderWidth = textBorderWidth;
      } else if (selectedNode.type === 'group') {
        updates.borderColor = nodeColor;
        // Set background color based on transparent flag and opacity
        updates.backgroundColor = nodeBgTransparent
          ? 'transparent'
          : hexToRgba(nodeBgColor, nodeBgOpacity);
        updates.description = nodeDescription;
      } else {
        updates.color = nodeColor;
        updates.operatingSystem = nodeOS;
        updates.description = nodeDescription;
      }

      onUpdateNode(selectedNode.id, updates);
    }
  };

  const handleEdgeUpdate = () => {
    if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, {
        label: edgeLabel,
        color: edgeColor,
        routingType: edgeRouting,
        animated: edgeAnimated,
        style: edgeStyle,
        markerStart: edgeMarkerStart,
        markerEnd: edgeMarkerEnd
      });
    }
  };

  const presetColors = [
    { name: 'Blue', value: theme.swatches.blue },
    { name: 'Green', value: theme.swatches.green },
    { name: 'Red', value: theme.swatches.red },
    { name: 'Orange', value: theme.swatches.orange },
    { name: 'Purple', value: theme.swatches.purple },
    { name: 'Pink', value: theme.swatches.pink },
    { name: 'Teal', value: theme.swatches.teal },
    { name: 'Gray', value: theme.swatches.gray }
  ];

  return (
    <div
      onMouseDown={(e) => {
        // Stop propagation to ReactFlow only when panel is open
        if (isOpen) {
          e.stopPropagation();
        }
      }}
      onClick={(e) => {
        // Stop propagation to ReactFlow only when panel is open
        if (isOpen) {
          e.stopPropagation();
        }
      }}
      onMouseUp={(e) => {
        // Stop propagation to ReactFlow only when panel is open
        if (isOpen) {
          e.stopPropagation();
        }
      }}
      style={{
        position: 'absolute',
        right: isOpen ? '0' : '-320px',
        top: 0,
        width: '320px',
        height: '100%',
        background: 'rgba(30, 33, 51, 0.65)',
        backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.1)',
        transition: theme.transition.slow,
        zIndex: theme.zIndex.modal,
        display: 'flex',
        flexDirection: 'column',
        color: theme.text.primary,
        borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
    >
      {/* Inner scroll container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
          borderBottom: `1px solid ${theme.border.default}`,
          background: theme.background.primary,
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <h3 style={{
            margin: 0,
            fontSize: theme.fontSize.base,
            fontWeight: theme.fontWeight.semibold,
            color: theme.text.primary
          }}>
            Settings
          </h3>
        </div>

        {/* Tabs for non-text nodes (not for edges or text nodes) */}
        {selectedNode && selectedNode.type !== 'text' && (
          <div style={{
            display: 'flex',
            borderBottom: `2px solid ${theme.border.default}`,
            background: theme.background.primary,
            position: 'sticky',
            top: '49px',
            zIndex: 10
          }}>
            <button
              onClick={() => setActiveTab('connection')}
              style={{
                flex: 1,
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                border: 'none',
                background: activeTab === 'connection' ? theme.background.secondary : 'transparent',
                color: activeTab === 'connection' ? theme.accent.blue : theme.text.secondary,
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                fontWeight: activeTab === 'connection' ? theme.fontWeight.semibold : theme.fontWeight.medium,
                borderBottom: activeTab === 'connection' ? `3px solid ${theme.accent.blue}` : '3px solid transparent',
                transition: theme.transition.normal,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'connection') {
                  e.currentTarget.style.background = theme.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'connection') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Connection
            </button>
            <button
              onClick={() => setActiveTab('property')}
              style={{
                flex: 1,
                padding: `${theme.spacing.md} ${theme.spacing.xl}`,
                border: 'none',
                background: activeTab === 'property' ? theme.background.secondary : 'transparent',
                color: activeTab === 'property' ? theme.accent.blue : theme.text.secondary,
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                fontWeight: activeTab === 'property' ? theme.fontWeight.semibold : theme.fontWeight.medium,
                borderBottom: activeTab === 'property' ? `3px solid ${theme.accent.blue}` : '3px solid transparent',
                transition: theme.transition.normal,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'property') {
                  e.currentTarget.style.background = theme.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'property') {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              Property
            </button>
          </div>
        )}

        {/* Node Styling */}
        {selectedNode && (
          <div style={{ padding: theme.spacing.xl }}>
            {/* Text Node - No tabs, just style content */}
            {selectedNode.type === 'text' && (
              <>
                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.text.secondary
                  }}>
                    Text
                  </label>
                  <input
                    type="text"
                    value={nodeLabel}
                    onChange={(e) => setNodeLabel(e.target.value)}
                    onBlur={handleNodeUpdate}
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      background: theme.background.tertiary,
                      color: theme.text.primary,
                      fontSize: theme.fontSize.sm,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.text.secondary
                  }}>
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={textFontSize}
                    onChange={(e) => setTextFontSize(parseInt(e.target.value) || 14)}
                    onBlur={handleNodeUpdate}
                    min="8"
                    max="72"
                    style={{
                      width: '100%',
                      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      background: theme.background.tertiary,
                      color: theme.text.primary,
                      fontSize: theme.fontSize.sm,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.text.secondary
                  }}>
                    Font Color
                  </label>
                  <input
                    type="color"
                    value={textFontColor}
                    onChange={(e) => setTextFontColor(e.target.value)}
                    onBlur={handleNodeUpdate}
                    style={{
                      width: '100%',
                      height: '32px',
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      cursor: 'pointer',
                      background: theme.background.tertiary
                    }}
                  />
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.text.secondary
                  }}>
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={textBgColor}
                    onChange={(e) => setTextBgColor(e.target.value)}
                    onBlur={handleNodeUpdate}
                    disabled={textBgTransparent}
                    style={{
                      width: '100%',
                      height: '32px',
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      cursor: textBgTransparent ? 'not-allowed' : 'pointer',
                      background: theme.background.tertiary,
                      opacity: textBgTransparent ? 0.5 : 1
                    }}
                  />
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    marginTop: theme.spacing.md,
                    fontSize: theme.fontSize.sm,
                    color: theme.text.secondary,
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={textBgTransparent}
                      onChange={(e) => {
                        setTextBgTransparent(e.target.checked);
                        setTimeout(handleNodeUpdate, 0);
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Transparent Background
                  </label>

                  {/* Opacity Slider */}
                  <div style={{ marginTop: theme.spacing.md }}>
                    <label style={{
                      display: 'block',
                      fontSize: theme.fontSize.sm,
                      marginBottom: theme.spacing.xs,
                      fontWeight: theme.fontWeight.medium,
                      color: textBgTransparent ? theme.text.tertiary : theme.text.secondary
                    }}>
                      Opacity: {textBgOpacity}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={textBgOpacity}
                      onChange={(e) => setTextBgOpacity(parseInt(e.target.value))}
                      onMouseUp={handleNodeUpdate}
                      disabled={textBgTransparent}
                      style={{
                        width: '100%',
                        cursor: textBgTransparent ? 'not-allowed' : 'pointer',
                        opacity: textBgTransparent ? 0.5 : 1
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: theme.spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: theme.fontSize.sm,
                    marginBottom: theme.spacing.xs,
                    fontWeight: theme.fontWeight.medium,
                    color: theme.text.secondary
                  }}>
                    Border Style
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing.sm }}>
                    {(['none', 'solid', 'dashed', 'dotted'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => {
                          setTextBorderStyle(style);
                          setTimeout(handleNodeUpdate, 0);
                        }}
                        style={{
                          padding: theme.spacing.sm,
                          border: textBorderStyle === style ? `1px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                          borderRadius: theme.radius.sm,
                          background: textBorderStyle === style ? theme.background.active : theme.background.tertiary,
                          color: theme.text.primary,
                          cursor: 'pointer',
                          fontSize: theme.fontSize.xs,
                          fontWeight: theme.fontWeight.medium,
                          textTransform: 'capitalize'
                        }}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {textBorderStyle !== 'none' && (
                  <>
                    <div style={{ marginBottom: theme.spacing.lg }}>
                      <label style={{
                        display: 'block',
                        fontSize: theme.fontSize.sm,
                        marginBottom: theme.spacing.xs,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.text.secondary
                      }}>
                        Border Color
                      </label>
                      <input
                        type="color"
                        value={textBorderColor}
                        onChange={(e) => setTextBorderColor(e.target.value)}
                        onBlur={handleNodeUpdate}
                        style={{
                          width: '100%',
                          height: '32px',
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: theme.radius.sm,
                          cursor: 'pointer',
                          background: theme.background.tertiary
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: theme.spacing.lg }}>
                      <label style={{
                        display: 'block',
                        fontSize: theme.fontSize.sm,
                        marginBottom: theme.spacing.xs,
                        fontWeight: theme.fontWeight.medium,
                        color: theme.text.secondary
                      }}>
                        Border Width
                      </label>
                      <input
                        type="number"
                        value={textBorderWidth}
                        onChange={(e) => setTextBorderWidth(parseInt(e.target.value) || 1)}
                        onBlur={handleNodeUpdate}
                        min="1"
                        max="10"
                        style={{
                          width: '100%',
                          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                          border: `1px solid ${theme.border.default}`,
                          borderRadius: theme.radius.sm,
                          background: theme.background.tertiary,
                          color: theme.text.primary,
                          fontSize: theme.fontSize.sm,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Non-text nodes with tabs */}
            {selectedNode.type !== 'text' && (
              <>
                {/* CONNECTION TAB */}
                {activeTab === 'connection' && (
                  <ConnectionConfigPanel
                    selectedNode={selectedNode}
                    onUpdateNode={onUpdateNode}
                  />
                )}

                {/* PROPERTY TAB */}
                {activeTab === 'property' && (
                  <>
                    <CollapsibleSection title="Appearance">
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Label</label>
                        <input
                          type="text"
                          value={nodeLabel}
                          onChange={(e) => setNodeLabel(e.target.value)}
                          onBlur={handleNodeUpdate}
                          style={inputStyle}
                        />
                      </div>

                      {/* Operating System - only for enhanced nodes */}
                      {selectedNode.type !== 'group' && (
                        <div style={fieldGroupStyle}>
                          <label style={labelStyle}>Operating System</label>
                          <input
                            type="text"
                            value={nodeOS}
                            onChange={(e) => setNodeOS(e.target.value)}
                            onBlur={handleNodeUpdate}
                            style={inputStyle}
                          />
                        </div>
                      )}
                    </CollapsibleSection>

                    {/* Color Section */}
                    {selectedNode.type === 'group' ? (
                      <>
                        {/* Group nodes: Border and Background colors */}
                        <div style={{ marginBottom: theme.spacing.lg }}>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.sm,
                            marginBottom: theme.spacing.sm,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Border Color
                          </label>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: theme.spacing.sm,
                            marginBottom: theme.spacing.sm
                          }}>
                            {presetColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => {
                                  setNodeColor(color.value);
                                  setTimeout(handleNodeUpdate, 0);
                                }}
                                style={{
                                  width: '100%',
                                  height: '32px',
                                  border: nodeColor === color.value ? `2px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                                  borderRadius: theme.radius.sm,
                                  background: color.value,
                                  cursor: 'pointer',
                                  transition: theme.transition.normal
                                }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          <input
                            type="color"
                            value={nodeColor}
                            onChange={(e) => setNodeColor(e.target.value)}
                            onBlur={handleNodeUpdate}
                            style={{
                              width: '100%',
                              height: '32px',
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              cursor: 'pointer',
                              background: theme.background.tertiary
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: theme.spacing.lg }}>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.sm,
                            marginBottom: theme.spacing.sm,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Background Color
                          </label>
                          <input
                            type="color"
                            value={nodeBgColor}
                            onChange={(e) => setNodeBgColor(e.target.value)}
                            onBlur={handleNodeUpdate}
                            disabled={nodeBgTransparent}
                            style={{
                              width: '100%',
                              height: '32px',
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              cursor: nodeBgTransparent ? 'not-allowed' : 'pointer',
                              background: theme.background.tertiary,
                              opacity: nodeBgTransparent ? 0.5 : 1
                            }}
                          />
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.sm,
                            marginTop: theme.spacing.md,
                            fontSize: theme.fontSize.sm,
                            color: theme.text.secondary,
                            cursor: 'pointer'
                          }}>
                            <input
                              type="checkbox"
                              checked={nodeBgTransparent}
                              onChange={(e) => {
                                setNodeBgTransparent(e.target.checked);
                                setTimeout(handleNodeUpdate, 0);
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            Transparent Background
                          </label>

                          {/* Opacity Slider */}
                          <div style={{ marginTop: theme.spacing.md }}>
                            <label style={{
                              display: 'block',
                              fontSize: theme.fontSize.sm,
                              marginBottom: theme.spacing.xs,
                              fontWeight: theme.fontWeight.medium,
                              color: nodeBgTransparent ? theme.text.tertiary : theme.text.secondary
                            }}>
                              Opacity: {nodeBgOpacity}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={nodeBgOpacity}
                              onChange={(e) => setNodeBgOpacity(parseInt(e.target.value))}
                              onMouseUp={handleNodeUpdate}
                              disabled={nodeBgTransparent}
                              style={{
                                width: '100%',
                                cursor: nodeBgTransparent ? 'not-allowed' : 'pointer',
                                opacity: nodeBgTransparent ? 0.5 : 1
                              }}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Enhanced nodes: Single color picker */}
                        <div style={{ marginBottom: theme.spacing.lg }}>
                          <label style={{
                            display: 'block',
                            fontSize: theme.fontSize.sm,
                            marginBottom: theme.spacing.sm,
                            fontWeight: theme.fontWeight.medium,
                            color: theme.text.secondary
                          }}>
                            Color
                          </label>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: theme.spacing.sm,
                            marginBottom: theme.spacing.sm
                          }}>
                            {presetColors.map((color) => (
                              <button
                                key={color.value}
                                onClick={() => {
                                  setNodeColor(color.value);
                                  setTimeout(handleNodeUpdate, 0);
                                }}
                                style={{
                                  width: '100%',
                                  height: '32px',
                                  border: nodeColor === color.value ? `2px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                                  borderRadius: theme.radius.sm,
                                  background: color.value,
                                  cursor: 'pointer',
                                  transition: theme.transition.normal
                                }}
                                title={color.name}
                              />
                            ))}
                          </div>
                          <input
                            type="color"
                            value={nodeColor}
                            onChange={(e) => setNodeColor(e.target.value)}
                            onBlur={handleNodeUpdate}
                            style={{
                              width: '100%',
                              height: '32px',
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              cursor: 'pointer',
                              background: theme.background.tertiary
                            }}
                          />
                        </div>
                      </>
                    )}

                    <CollapsibleSection title="Details">
                      <div style={fieldGroupStyle}>
                        <label style={labelStyle}>Description</label>
                        <textarea
                          value={nodeDescription}
                          onChange={(e) => setNodeDescription(e.target.value)}
                          onBlur={handleNodeUpdate}
                          rows={3}
                          style={{
                            ...inputStyle,
                            resize: 'vertical',
                            fontFamily: 'inherit',
                          }}
                        />
                      </div>
                    </CollapsibleSection>

                    {/* Layer Order Controls - Only in Style Tab */}
                    {onMoveToFront && onMoveToBack && (
                      <CollapsibleSection title="Actions" defaultOpen={false}>
                        <label style={labelStyle}>Layer Order</label>
                        <div style={{ display: 'flex', gap: theme.spacing.md }}>
                          <button
                            onClick={() => onMoveToFront(selectedNode.id)}
                            style={{
                              flex: 1,
                              padding: theme.spacing.md,
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              background: theme.background.tertiary,
                              color: theme.text.primary,
                              cursor: 'pointer',
                              fontSize: theme.fontSize.sm,
                              fontWeight: theme.fontWeight.medium,
                              transition: theme.transition.normal
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme.background.hover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.background.tertiary;
                            }}
                          >
                            Bring to Front
                          </button>
                          <button
                            onClick={() => onMoveToBack(selectedNode.id)}
                            style={{
                              flex: 1,
                              padding: theme.spacing.md,
                              border: `1px solid ${theme.border.default}`,
                              borderRadius: theme.radius.sm,
                              background: theme.background.tertiary,
                              color: theme.text.primary,
                              cursor: 'pointer',
                              fontSize: theme.fontSize.sm,
                              fontWeight: theme.fontWeight.medium,
                              transition: theme.transition.normal
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = theme.background.hover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = theme.background.tertiary;
                            }}
                          >
                            Send to Back
                          </button>
                        </div>
                      </CollapsibleSection>
                    )}
                  </>
                )}
              </>
            )}

          </div>
        )}

        {/* Edge Styling */}
        {selectedEdge && (
          <div style={{ padding: theme.spacing.xl }}>
            <CollapsibleSection title="Line">
              <div style={fieldGroupStyle}>
                <label style={labelStyle}>Label</label>
                <input
                  type="text"
                  value={edgeLabel}
                  onChange={(e) => setEdgeLabel(e.target.value)}
                  onBlur={handleEdgeUpdate}
                  style={inputStyle}
                />
              </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.sm,
                marginBottom: theme.spacing.xs,
                fontWeight: theme.fontWeight.medium,
                color: theme.text.secondary
              }}>
                Line Style
              </label>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                  <button
                    key={style}
                    onClick={() => {
                      setEdgeStyle(style);
                      if (selectedEdge) {
                        onUpdateEdge(selectedEdge.id, {
                          label: edgeLabel,
                          color: edgeColor,
                          style: style,
                          routingType: edgeRouting,
                          animated: edgeAnimated,
                          markerStart: edgeMarkerStart,
                          markerEnd: edgeMarkerEnd
                        });
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      border: edgeStyle === style ? `1px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      background: edgeStyle === style ? theme.background.active : theme.background.tertiary,
                      color: theme.text.primary,
                      cursor: 'pointer',
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                      textTransform: 'capitalize'
                    }}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.sm,
                marginBottom: theme.spacing.xs,
                fontWeight: theme.fontWeight.medium,
                color: theme.text.secondary
              }}>
                Routing
              </label>
              <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                {(['bezier', 'smoothstep', 'straight'] as const).map((routing) => (
                  <button
                    key={routing}
                    onClick={() => {
                      setEdgeRouting(routing);
                      if (selectedEdge) {
                        onUpdateEdge(selectedEdge.id, {
                          label: edgeLabel,
                          color: edgeColor,
                          style: edgeStyle,
                          routingType: routing,
                          animated: edgeAnimated,
                          markerStart: edgeMarkerStart,
                          markerEnd: edgeMarkerEnd
                        });
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      border: edgeRouting === routing ? `1px solid ${theme.text.primary}` : `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      background: edgeRouting === routing ? theme.background.active : theme.background.tertiary,
                      color: theme.text.primary,
                      cursor: 'pointer',
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.medium,
                      textTransform: 'capitalize'
                    }}
                  >
                    {routing === 'smoothstep' ? 'Step' : routing}
                  </button>
                ))}
              </div>
            </div>
            </CollapsibleSection>

            <CollapsibleSection title="Markers" defaultOpen={false}>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                cursor: 'pointer',
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.medium,
                color: theme.text.secondary
              }}>
                <input
                  type="checkbox"
                  checked={edgeAnimated}
                  onChange={(e) => {
                    const newAnimated = e.target.checked;
                    setEdgeAnimated(newAnimated);
                    if (selectedEdge) {
                      onUpdateEdge(selectedEdge.id, {
                        label: edgeLabel,
                        color: edgeColor,
                        style: edgeStyle,
                        routingType: edgeRouting,
                        animated: newAnimated,
                        markerStart: edgeMarkerStart,
                        markerEnd: edgeMarkerEnd
                      });
                    }
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Animated Flow
              </label>
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.sm,
                marginBottom: theme.spacing.xs,
                fontWeight: theme.fontWeight.medium,
                color: theme.text.secondary
              }}>
                Color
              </label>
              <input
                type="color"
                value={edgeColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setEdgeColor(newColor);
                  if (selectedEdge) {
                    onUpdateEdge(selectedEdge.id, {
                      label: edgeLabel,
                      color: newColor,
                      style: edgeStyle,
                      routingType: edgeRouting,
                      animated: edgeAnimated,
                      markerStart: edgeMarkerStart,
                      markerEnd: edgeMarkerEnd
                    });
                  }
                }}
                style={{
                  width: '100%',
                  height: '32px',
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  cursor: 'pointer',
                  background: theme.background.tertiary
                }}
              />
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.sm,
                marginBottom: theme.spacing.xs,
                fontWeight: theme.fontWeight.medium,
                color: theme.text.secondary
              }}>
                Start Marker
              </label>
              <select
                value={edgeMarkerStart}
                onChange={(e) => {
                  const newMarker = e.target.value;
                  setEdgeMarkerStart(newMarker);
                  if (selectedEdge) {
                    onUpdateEdge(selectedEdge.id, {
                      label: edgeLabel,
                      color: edgeColor,
                      style: edgeStyle,
                      routingType: edgeRouting,
                      animated: edgeAnimated,
                      markerStart: newMarker,
                      markerEnd: edgeMarkerEnd
                    });
                  }
                }}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  background: theme.background.tertiary,
                  color: theme.text.primary,
                  fontSize: theme.fontSize.sm,
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="none">None</option>
                <option value="arrow">Arrow (Filled)</option>
                <option value="arrow-open">Arrow (Open)</option>
                <option value="diamond">Diamond (Hollow)</option>
                <option value="diamond-filled">Diamond (Filled)</option>
                <option value="circle">Circle (Hollow)</option>
                <option value="circle-filled">Circle (Filled)</option>
                <option value="square">Square (Hollow)</option>
                <option value="square-filled">Square (Filled)</option>
                <option value="cross">Cross</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            <div style={{ marginBottom: theme.spacing.lg }}>
              <label style={{
                display: 'block',
                fontSize: theme.fontSize.sm,
                marginBottom: theme.spacing.xs,
                fontWeight: theme.fontWeight.medium,
                color: theme.text.secondary
              }}>
                End Marker
              </label>
              <select
                value={edgeMarkerEnd}
                onChange={(e) => {
                  const newMarker = e.target.value;
                  setEdgeMarkerEnd(newMarker);
                  if (selectedEdge) {
                    onUpdateEdge(selectedEdge.id, {
                      label: edgeLabel,
                      color: edgeColor,
                      style: edgeStyle,
                      routingType: edgeRouting,
                      animated: edgeAnimated,
                      markerStart: edgeMarkerStart,
                      markerEnd: newMarker
                    });
                  }
                }}
                style={{
                  width: '100%',
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  border: `1px solid ${theme.border.default}`,
                  borderRadius: theme.radius.sm,
                  background: theme.background.tertiary,
                  color: theme.text.primary,
                  fontSize: theme.fontSize.sm,
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              >
                <option value="none">None</option>
                <option value="arrow">Arrow (Filled)</option>
                <option value="arrow-open">Arrow (Open)</option>
                <option value="diamond">Diamond (Hollow)</option>
                <option value="diamond-filled">Diamond (Filled)</option>
                <option value="circle">Circle (Hollow)</option>
                <option value="circle-filled">Circle (Filled)</option>
                <option value="square">Square (Hollow)</option>
                <option value="square-filled">Square (Filled)</option>
                <option value="cross">Cross</option>
                <option value="bar">Bar</option>
              </select>
            </div>
            </CollapsibleSection>

          </div>
        )}

        {!selectedNode && !selectedEdge && (
          <div style={{
            padding: `${theme.spacing.xxxl} ${theme.spacing.xxl}`,
            textAlign: 'center',
            color: theme.text.tertiary
          }}>
            <div style={{ marginBottom: theme.spacing.lg }}><PencilIcon size={36} color={theme.text.tertiary} /></div>
            <p style={{ fontSize: theme.fontSize.sm, margin: 0 }}>
              Select a node or edge to customize
            </p>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="panel-glass"
        style={{
          position: 'absolute',
          left: '-30px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          borderRight: 'none',
          borderTopLeftRadius: theme.radius.md,
          borderBottomLeftRadius: theme.radius.md,
          fontSize: theme.fontSize.lg,
          boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        {isOpen ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
      </button>
    </div>
  );
};

export default StylePanel;
