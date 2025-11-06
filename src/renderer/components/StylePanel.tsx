import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { EnhancedDeviceData } from './EnhancedDeviceNode';
import { GroupNodeData } from './GroupNode';
import { CustomEdgeData } from './CustomEdge';
import { TextNodeData } from './TextNode';

interface StylePanelProps {
  selectedNode: Node | null;
  selectedEdge: Edge | null;
  onUpdateNode: (nodeId: string, data: Partial<EnhancedDeviceData | GroupNodeData | TextNodeData>) => void;
  onUpdateEdge: (edgeId: string, data: Partial<CustomEdgeData>) => void;
  onMoveToFront?: (nodeId: string) => void;
  onMoveToBack?: (nodeId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const StylePanel: React.FC<StylePanelProps> = ({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onMoveToFront,
  onMoveToBack,
  isOpen,
  onToggle
}) => {
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('#1976d2');
  const [nodeIP, setNodeIP] = useState('');
  const [nodeDescription, setNodeDescription] = useState('');
  const [nodeOS, setNodeOS] = useState('');
  const [nodeHost, setNodeHost] = useState('');
  const [nodePort, setNodePort] = useState(22);
  const [nodeUsername, setNodeUsername] = useState('');
  const [nodePassword, setNodePassword] = useState('');
  const [nodeType, setNodeType] = useState<'rdp' | 'ssh' | 'browser'>('ssh');
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

  useEffect(() => {
    if (selectedNode) {
      const data = selectedNode.data as unknown as EnhancedDeviceData | GroupNodeData | TextNodeData;
      setNodeLabel(data.label || '');

      if (selectedNode.type === 'text') {
        const textData = data as TextNodeData;
        setTextFontSize(textData.fontSize || 14);
        setTextFontColor(textData.fontColor || '#000000');
        setTextBgColor(textData.backgroundColor || 'transparent');
        setTextBorderColor(textData.borderColor || '#000000');
        setTextBorderStyle(textData.borderStyle || 'none');
        setTextBorderWidth(textData.borderWidth || 1);
      } else {
        setNodeColor((data as any).color || (data as any).borderColor || '#1976d2');
        setNodeIP((data as EnhancedDeviceData).ipAddress || '');
        setNodeDescription((data as any).description || '');
        setNodeOS((data as EnhancedDeviceData).operatingSystem || '');
        setNodeHost((data as EnhancedDeviceData).host || '');
        setNodePort((data as EnhancedDeviceData).port || 22);
        setNodeUsername((data as EnhancedDeviceData).username || '');
        setNodePassword((data as EnhancedDeviceData).password || '');

        // Determine type from existing type field
        const deviceType = (data as EnhancedDeviceData).type;
        if (deviceType === 'windows') {
          setNodeType('rdp');
        } else if (deviceType === 'linux') {
          setNodeType('ssh');
        } else {
          setNodeType('browser');
        }
      }
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      const data = (selectedEdge.data as unknown as CustomEdgeData) || {};
      setEdgeLabel(data.label || '');
      setEdgeColor(data.color || '#000000');
      setEdgeStyle(data.style || 'solid');
      setEdgeRouting(data.routingType || 'bezier');
      setEdgeAnimated(data.animated || false);
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
        updates.backgroundColor = textBgColor;
        updates.borderColor = textBorderColor;
        updates.borderStyle = textBorderStyle;
        updates.borderWidth = textBorderWidth;
      } else if (selectedNode.type === 'group') {
        updates.borderColor = nodeColor;
        updates.description = nodeDescription;
      } else {
        updates.color = nodeColor;
        updates.ipAddress = nodeIP;
        updates.operatingSystem = nodeOS;
        updates.host = nodeHost;
        updates.port = nodePort;
        updates.username = nodeUsername;
        updates.password = nodePassword;
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
              {selectedNode.type === 'text' ? 'Text' : 'Label'}
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

          {selectedNode.type === 'text' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: '#fff'
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Background Color
                </label>
                <input
                  type="color"
                  value={textBgColor === 'transparent' ? '#ffffff' : textBgColor}
                  onChange={(e) => setTextBgColor(e.target.value)}
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
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  fontSize: '10px',
                  color: '#666',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={textBgColor === 'transparent'}
                    onChange={(e) => {
                      setTextBgColor(e.target.checked ? 'transparent' : '#ffffff');
                      setTimeout(handleNodeUpdate, 0);
                    }}
                    style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                  />
                  Transparent
                </label>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Border Style
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  {(['none', 'solid', 'dashed', 'dotted'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => {
                        setTextBorderStyle(style);
                        setTimeout(handleNodeUpdate, 0);
                      }}
                      style={{
                        padding: '6px',
                        border: textBorderStyle === style ? '1px solid #333' : '1px solid #ccc',
                        borderRadius: '4px',
                        background: textBorderStyle === style ? '#bbb' : '#fff',
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

              {textBorderStyle !== 'none' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
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
                </>
              )}
            </>
          )}

          {selectedNode.type !== 'group' && (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Operating System
                </label>
                <input
                  type="text"
                  value={nodeOS}
                  onChange={(e) => setNodeOS(e.target.value)}
                  onBlur={handleNodeUpdate}
                  placeholder="Windows Server 2019"
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Connection Type
                </label>
                <select
                  value={nodeType}
                  onChange={(e) => {
                    setNodeType(e.target.value as 'rdp' | 'ssh' | 'browser');
                    handleNodeUpdate();
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="rdp">RDP</option>
                  <option value="ssh">SSH</option>
                  <option value="browser">Browser</option>
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Host
                </label>
                <input
                  type="text"
                  value={nodeHost}
                  onChange={(e) => setNodeHost(e.target.value)}
                  onBlur={handleNodeUpdate}
                  placeholder="192.168.1.100"
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Port
                </label>
                <input
                  type="number"
                  value={nodePort}
                  onChange={(e) => setNodePort(parseInt(e.target.value) || 22)}
                  onBlur={handleNodeUpdate}
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

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: '500', color: '#666' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={nodeUsername}
                  onChange={(e) => setNodeUsername(e.target.value)}
                  onBlur={handleNodeUpdate}
                  placeholder="admin"
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
                  Password
                </label>
                <input
                  type="password"
                  value={nodePassword}
                  onChange={(e) => setNodePassword(e.target.value)}
                  onBlur={handleNodeUpdate}
                  placeholder="••••••••"
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

              <div style={{
                marginBottom: '12px',
                padding: '8px',
                background: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '10px',
                color: '#666'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Command:</div>
                <div style={{
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  color: '#333'
                }}>
                  {nodeType === 'rdp' && `mstsc /v:${nodeHost || 'HOST'}`}
                  {nodeType === 'ssh' && `ssh ${nodeUsername || 'USER'}@${nodeHost || 'HOST'} -p ${nodePort}`}
                  {nodeType === 'browser' && `start ${nodeHost || 'URL'}`}
                </div>
              </div>
            </>
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

          {/* Layering Controls */}
          {onMoveToFront && onMoveToBack && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d0d0d0' }}>
              <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', fontWeight: '500', color: '#666' }}>
                Layer Order
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => onMoveToFront(selectedNode.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  Bring to Front
                </button>
                <button
                  onClick={() => onMoveToBack(selectedNode.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    background: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  Send to Back
                </button>
              </div>
            </div>
          )}
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
