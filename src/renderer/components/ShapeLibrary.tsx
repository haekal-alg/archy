import React, { useState } from 'react';
import {
  RouterIcon,
  ServerIcon,
  FirewallIcon,
  DesktopIcon,
  LinuxIcon,
  SwitchIcon,
  CloudIcon,
  DatabaseIcon,
  LaptopIcon,
  AttackIcon,
  GenericIcon
} from './NetworkIcons';

interface ShapeLibraryProps {
  onAddNode: (type: string) => void;
  onAddGroup: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ShapeLibrary: React.FC<ShapeLibraryProps> = ({ onAddNode, onAddGroup, isOpen, onToggle }) => {
  const [activeCategory, setActiveCategory] = useState<'devices' | 'network' | 'infra' | 'security'>('devices');

  const shapes = {
    devices: [
      { type: 'windows', icon: DesktopIcon, label: 'Windows', color: '#0078d4' },
      { type: 'linux', icon: LinuxIcon, label: 'Linux', color: '#f7a41d' },
      { type: 'laptop', icon: LaptopIcon, label: 'Laptop', color: '#546e7a' },
      { type: 'generic', icon: GenericIcon, label: 'Generic', color: '#666666' },
    ],
    network: [
      { type: 'router', icon: RouterIcon, label: 'Router', color: '#1976d2' },
      { type: 'switch', icon: SwitchIcon, label: 'Switch', color: '#455a64' },
      { type: 'firewall', icon: FirewallIcon, label: 'Firewall', color: '#d32f2f' },
    ],
    infra: [
      { type: 'server', icon: ServerIcon, label: 'Server', color: '#2e7d32' },
      { type: 'database', icon: DatabaseIcon, label: 'Database', color: '#7b1fa2' },
      { type: 'cloud', icon: CloudIcon, label: 'Cloud', color: '#4285f4' },
    ],
    security: [
      { type: 'attacker', icon: AttackIcon, label: 'Attacker', color: '#e91e63' },
      { type: 'firewall', icon: FirewallIcon, label: 'Firewall', color: '#d32f2f' },
    ]
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: isOpen ? '0' : '-240px',
        top: '0',
        width: '240px',
        height: '100vh',
        background: '#e8e8e8',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        transition: 'left 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        color: '#333'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #d0d0d0',
        background: '#d8d8d8'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>Shapes</h3>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '4px',
        padding: '8px',
        background: '#d8d8d8'
      }}>
        {Object.keys(shapes).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as any)}
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              background: activeCategory === category ? '#bbb' : '#fff',
              color: '#333',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Shapes Grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
        alignContent: 'start'
      }}>
        {shapes[activeCategory].map((shape) => (
          <button
            key={shape.type}
            onClick={() => onAddNode(shape.type)}
            style={{
              padding: '12px 8px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              background: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              color: '#333'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#fff';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ transform: 'scale(0.7)' }}>
              <shape.icon color="#666" />
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {shape.label}
            </span>
          </button>
        ))}
      </div>

      {/* Add Group Button */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #d0d0d0',
        background: '#d8d8d8'
      }}>
        <button
          onClick={onAddGroup}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: '#fff',
            color: '#333',
            cursor: 'pointer',
            fontSize: '12px',
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
          + Network Zone
        </button>
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          right: '-30px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          border: 'none',
          borderTopRightRadius: '6px',
          borderBottomRightRadius: '6px',
          background: '#e8e8e8',
          color: '#333',
          cursor: 'pointer',
          fontSize: '16px',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#d0d0d0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#e8e8e8';
        }}
      >
        {isOpen ? '◀' : '▶'}
      </button>
    </div>
  );
};

export default ShapeLibrary;
