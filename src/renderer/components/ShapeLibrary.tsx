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
import theme from '../../theme';

interface ShapeLibraryProps {
  onAddNode: (type: string) => void;
  onAddGroup: () => void;
  onAddText?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ShapeLibrary: React.FC<ShapeLibraryProps> = ({ onAddNode, onAddGroup, onAddText, isOpen, onToggle }) => {
  const [activeCategory, setActiveCategory] = useState<'devices' | 'network' | 'infra' | 'security'>('devices');

  const shapes = {
    devices: [
      { type: 'windows', icon: DesktopIcon, label: 'Windows', color: theme.device.windows },
      { type: 'linux', icon: LinuxIcon, label: 'Linux', color: theme.device.linux },
      { type: 'laptop', icon: LaptopIcon, label: 'Laptop', color: theme.device.laptop },
      { type: 'generic', icon: GenericIcon, label: 'Generic', color: theme.text.tertiary },
    ],
    network: [
      { type: 'router', icon: RouterIcon, label: 'Router', color: theme.device.router },
      { type: 'switch', icon: SwitchIcon, label: 'Switch', color: theme.device.switch },
      { type: 'firewall', icon: FirewallIcon, label: 'Firewall', color: theme.device.firewall },
    ],
    infra: [
      { type: 'server', icon: ServerIcon, label: 'Server', color: theme.device.server },
      { type: 'database', icon: DatabaseIcon, label: 'Database', color: theme.device.database },
      { type: 'cloud', icon: CloudIcon, label: 'Cloud', color: theme.device.cloud },
    ],
    security: [
      { type: 'attacker', icon: AttackIcon, label: 'Attacker', color: theme.device.attacker },
      { type: 'firewall', icon: FirewallIcon, label: 'Firewall', color: theme.device.firewall },
    ]
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: isOpen ? '0' : '-240px',
        top: '49px',
        width: '240px',
        height: 'calc(100vh - 49px)',
        background: 'rgba(30, 33, 51, 0.65)',
        backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 1px 0 0 rgba(255, 255, 255, 0.1)',
        transition: theme.transition.slow,
        zIndex: theme.zIndex.dropdown,
        display: 'flex',
        flexDirection: 'column',
        color: theme.text.primary,
        borderRight: '1px solid rgba(255, 255, 255, 0.25)'
      }}
    >
      {/* Header */}
      <div style={{
        padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
        borderBottom: `1px solid ${theme.border.default}`,
        background: theme.background.primary
      }}>
        <h3 style={{
          margin: 0,
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.semibold,
          color: theme.text.primary
        }}>Shapes</h3>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
        background: theme.background.primary
      }}>
        {Object.keys(shapes).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category as any)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${activeCategory === category ? theme.accent.blue : theme.border.default}`,
              borderRadius: theme.radius.sm,
              background: activeCategory === category ? theme.background.active : theme.background.tertiary,
              color: activeCategory === category ? theme.text.primary : theme.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              textTransform: 'capitalize',
              transition: theme.transition.normal
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
        padding: theme.spacing.lg,
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: theme.spacing.md,
        alignContent: 'start'
      }}>
        {shapes[activeCategory].map((shape) => (
          <button
            key={shape.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', shape.type);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={() => onAddNode(shape.type)}
            style={{
              padding: `${theme.spacing.lg} ${theme.spacing.md}`,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.md,
              background: theme.background.tertiary,
              cursor: 'grab',
              transition: theme.transition.normal,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: theme.spacing.sm,
              color: theme.text.primary
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = theme.background.hover;
              e.currentTarget.style.boxShadow = theme.shadow.md;
              e.currentTarget.style.borderColor = theme.accent.blue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = theme.background.tertiary;
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = theme.border.default;
            }}
          >
            <div style={{ transform: 'scale(0.7)' }}>
              <shape.icon color={shape.color} />
            </div>
            <span style={{
              fontSize: theme.fontSize.xs,
              fontWeight: theme.fontWeight.medium,
              textAlign: 'center',
              color: theme.text.secondary
            }}>
              {shape.label}
            </span>
          </button>
        ))}
      </div>

      {/* Add Group and Text Buttons */}
      <div style={{
        padding: theme.spacing.lg,
        borderTop: `1px solid ${theme.border.default}`,
        background: theme.background.primary,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing.md
      }}>
        <button
          onClick={onAddGroup}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            border: `1px solid ${theme.border.default}`,
            borderRadius: theme.radius.sm,
            background: theme.background.tertiary,
            color: theme.text.primary,
            cursor: 'pointer',
            fontSize: theme.fontSize.md,
            fontWeight: theme.fontWeight.medium,
            transition: theme.transition.normal
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.background.hover;
            e.currentTarget.style.borderColor = theme.accent.blue;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.background.tertiary;
            e.currentTarget.style.borderColor = theme.border.default;
          }}
        >
          + Network Zone
        </button>
        {onAddText && (
          <button
            onClick={onAddText}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
              background: theme.background.tertiary,
              color: theme.text.primary,
              cursor: 'pointer',
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.medium,
              transition: theme.transition.normal
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.background.hover;
              e.currentTarget.style.borderColor = theme.accent.blue;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.background.tertiary;
              e.currentTarget.style.borderColor = theme.border.default;
            }}
          >
            + Text Label
          </button>
        )}
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
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderLeft: 'none',
          borderTopRightRadius: theme.radius.md,
          borderBottomRightRadius: theme.radius.md,
          background: 'rgba(30, 33, 51, 0.65)',
          backdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          WebkitBackdropFilter: 'blur(60px) saturate(200%) brightness(1.1)',
          color: theme.text.primary,
          cursor: 'pointer',
          fontSize: theme.fontSize.lg,
          boxShadow: theme.shadow.md,
          transition: theme.transition.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.background.hover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.background.secondary;
        }}
      >
        {isOpen ? '◀' : '▶'}
      </button>
    </div>
  );
};

export default ShapeLibrary;
