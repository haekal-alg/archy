import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { EnhancedDeviceData } from './EnhancedDeviceNode';
import { GroupNodeData } from './GroupNode';
import { CustomEdgeData } from './CustomEdge';

interface StylePanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, data: Partial<EnhancedDeviceData | GroupNodeData>) => void;
  onUpdateEdge: (edgeId: string, data: Partial<CustomEdgeData>) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const StylePanel: React.FC<StylePanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  isOpen,
  onToggle
}) => {
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#1976d2');
  const [nodeIP, setNodeIP] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [edgeLabel, setEdgeLabel] = useState('');
  const [edgeColor, setEdgeColor] = useState('#b1b1b7');
  const [edgeStyle, setEdgeStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [edgeRouting, setEdgeRouting] = useState<'bezier' | 'smoothstep' | 'straight'>('bezier');
  const [edgeAnimated, setEdgeAnimated] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data as unknown as EnhancedDeviceData | GroupNodeData;
      setNodeLabel(data.label || '');
      setNodeColor((data as any).color || (data as any).borderColor || '#1976d2');
      setNodeIP((data as EnhancedDeviceData).ipAddress || '');
      setNodeDescription(data.description || '');
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      const data = (selectedEdge.data as unknown as CustomEdgeData) || {};
      setEdgeLabel(data.label || '');
      setEdgeColor(data.color || '#b1b1b7');
      setEdgeStyle(data.style || 'solid');
      setEdgeRouting(data.routingType || 'bezier');
      setEdgeAnimated(data.animated || false);
    }
  }, [selectedEdge]);

  const handleNodeUpdate = () => {
    if (selectedNode) {
      const updates: any = {
        label: nodeLabel,
        description: nodeDescription
      };

      if (selectedNode.type === 'group') {
        updates.borderColor = nodeColor;
      } else {
        updates.color = nodeColor;
        updates.ipAddress = nodeIP;
      }

      onUpdateNode(selectedNode.id, updates);
    }
  };

  const handleEdgeUpdate = () => {
    if (selectedEdge) {
      onUpdateEdge(selectedEdge.id, {
        label: edgeLabel,
        color: edgeColor,
        style: edgeStyle,
        routingType: edgeRouting,
        animated: edgeAnimated
      });
    }
  };

  const presetColors = [
    { name: 'Blue', value: '#5d7fa3' },
    { name: 'Green', value: '#6b8f71' },
    { name: 'Red', value: '#b06c6c' },
    { name: 'Orange', value: '#c89b6e' },
    { name: 'Purple', value: '#8a7a9e' },
    { name: 'Pink', value: '#b5788c' },
    { name: 'Teal', value: '#6b9990' },
    { name: 'Gray', value: '#7a8a95' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        right: isOpen ? '0' : '-240px',
        top: '0',
        width: '240px',
        height: '100vh',
        background: '#e8e8e8',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
        transition: 'right 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        color: '#333',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #d0d0d0',
        background: '#d8d8d8',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>
          {selectedNode ? 'Node Style' : selectedEdge ? 'Edge Style' : 'Properties'}
        </h3>
      </div>

      {/* Node Styling */}
      {selectedNode && (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Label
            </label>
            <input
              type="text"
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              onBlur={handleNodeUpdate}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                color: '#333',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {selectedNode.type !== 'group' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                IP Address
              </label>
              <input
                type="text"
                value={nodeIP}
                onChange={(e) => setNodeIP(e.target.value)}
                onBlur={handleNodeUpdate}
                placeholder="10.2.70.5"
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  background: '#fff',
                  color: '#333',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Description
            </label>
            <textarea
              value={nodeDescription}
              onChange={(e) => setNodeDescription(e.target.value)}
              onBlur={handleNodeUpdate}
              rows={2}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                color: '#333',
                fontSize: '11px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '6px', fontWeight: '500', color: '#666' }}>
              Color
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              marginBottom: '6px'
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
                    border: nodeColor === color.value ? '2px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    background: color.value,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
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
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#fff'
              }}
            />
          </div>
        </div>
      )}

      {/* Edge Styling */}
      {selectedEdge && (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Label
            </label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => setEdgeLabel(e.target.value)}
              onBlur={handleEdgeUpdate}
              placeholder="Protocol, bandwidth, etc."
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                color: '#333',
                fontSize: '12px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Line Style
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['solid', 'dashed', 'dotted'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setEdgeStyle(style);
                    setTimeout(handleEdgeUpdate, 0);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: edgeStyle === style ? '1px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    background: edgeStyle === style ? '#bbb' : '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Routing
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['bezier', 'smoothstep', 'straight'] as const).map((routing) => (
                <button
                  key={routing}
                  onClick={() => {
                    setEdgeRouting(routing);
                    setTimeout(handleEdgeUpdate, 0);
                  }}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: edgeRouting === routing ? '1px solid #333' : '1px solid #ccc',
                    borderRadius: '4px',
                    background: edgeRouting === routing ? '#bbb' : '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: '500',
                    textTransform: 'capitalize'
                  }}
                >
                  {routing === 'smoothstep' ? 'Step' : routing}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              color: '#666'
            }}>
              <input
                type="checkbox"
                checked={edgeAnimated}
                onChange={(e) => {
                  setEdgeAnimated(e.target.checked);
                  setTimeout(handleEdgeUpdate, 0);
                }}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              Animated Flow
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
              Color
            </label>
            <input
              type="color"
              value={edgeColor}
              onChange={(e) => setEdgeColor(e.target.value)}
              onBlur={handleEdgeUpdate}
              style={{
                width: '100%',
                height: '32px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#fff'
              }}
            />
          </div>
        </div>
      )}

      {!selectedNode && !selectedEdge && (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#999'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✏️</div>
          <p style={{ fontSize: '12px', margin: 0 }}>
            Select a node or edge to customize
          </p>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          right: isOpen ? '240px' : '0',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          border: 'none',
          borderTopLeftRadius: '6px',
          borderBottomLeftRadius: '6px',
          background: '#e8e8e8',
          color: '#333',
          cursor: 'pointer',
          fontSize: '16px',
          boxShadow: '-2px 0 8px rgba(0,0,0,0.15)',
          transition: 'right 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#d0d0d0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#e8e8e8';
        }}
      >
        {isOpen ? '▶' : '◀'}
      </button>
    </div>
  );
};

export default StylePanel;
