import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './StatusIcons';
import {
  DynamicIcon,
  RouterIcon,
  ServerIcon,
  FirewallIcon,
  DesktopIcon,
  LinuxIcon,
  SwitchIcon,
  CloudIcon,
  CloudIcon2,
  DatabaseIcon,
  LaptopIcon,
  AttackIcon,
  GenericIcon,
  MobileIcon
} from './NetworkIcons';
import theme from '../../theme';
import { getCategories, getIcons, isLoaded, onIconsLoaded, IconCategory, LoadedIcon } from '../iconStore';

interface ShapeLibraryProps {
  onAddNode: (type: string) => void;
  onAddGroup: () => void;
  onAddText?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

// Built-in fallback icon map: deviceType -> { component, color }
const builtInIcons: Record<string, { component: React.FC<{ color?: string; size?: number }>; color: string }> = {
  windows: { component: DesktopIcon, color: theme.device.windows },
  linux: { component: LinuxIcon, color: theme.device.linux },
  laptop: { component: LaptopIcon, color: theme.device.laptop },
  mobile: { component: MobileIcon, color: (theme.device as any).mobile || '#3ddc84' },
  generic: { component: GenericIcon, color: theme.text.tertiary },
  router: { component: RouterIcon, color: theme.device.router },
  switch: { component: SwitchIcon, color: theme.device.switch },
  firewall: { component: FirewallIcon, color: theme.device.firewall },
  server: { component: ServerIcon, color: theme.device.server },
  database: { component: DatabaseIcon, color: theme.device.database },
  cloud: { component: CloudIcon, color: theme.device.cloud },
  cloud2: { component: CloudIcon2, color: '#5c9ded' },
  attacker: { component: AttackIcon, color: theme.device.attacker },
};

// Hardcoded fallback categories when icons haven't loaded from disk
const fallbackCategories: IconCategory[] = [
  { id: 'devices', label: 'Devices', icons: ['desktop', 'linux', 'laptop', 'mobile', 'generic'] },
  { id: 'network', label: 'Network', icons: ['router', 'switch', 'firewall'] },
  { id: 'infra', label: 'Infra', icons: ['server', 'database', 'cloud', 'cloud2'] },
  { id: 'security', label: 'Security', icons: ['attacker', 'firewall'] },
];

interface ShapeEntry {
  type: string; // deviceType used for node creation
  label: string;
  iconName: string; // key in loaded icons (or builtInIcons)
}

const ShapeLibrary: React.FC<ShapeLibraryProps> = ({ onAddNode, onAddGroup, onAddText, isOpen, onToggle }) => {
  const [activeCategory, setActiveCategory] = useState('devices');
  const [, forceUpdate] = useState(0);

  // Re-render once icons finish loading
  useEffect(() => {
    if (!isLoaded()) {
      return onIconsLoaded(() => forceUpdate((n) => n + 1));
    }
  }, []);

  // Build categories and shapes from loaded data (or fallback)
  const categories = isLoaded() && getCategories().length > 0 ? getCategories() : fallbackCategories;
  const loadedIcons = getIcons();

  const getShapesForCategory = (catId: string): ShapeEntry[] => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return [];

    return cat.icons.map((iconName) => {
      const loaded = loadedIcons[iconName];
      if (loaded) {
        return { type: loaded.deviceType, label: loaded.label, iconName };
      }
      // Fallback: use iconName as deviceType
      const bi = builtInIcons[iconName];
      return { type: iconName, label: bi ? iconName.charAt(0).toUpperCase() + iconName.slice(1) : iconName, iconName };
    });
  };

  const renderShapeIcon = (shape: ShapeEntry) => {
    const loaded = loadedIcons[shape.iconName];
    if (loaded) {
      // Render the loaded SVG at preview size
      const previewSize = 36;
      return (
        <div
          style={{ width: previewSize, height: previewSize, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          dangerouslySetInnerHTML={{
            __html: loaded.svg
              .replace(/width="[^"]*"/, `width="${previewSize}"`)
              .replace(/height="[^"]*"/, `height="${previewSize}"`)
          }}
        />
      );
    }
    // Fallback to built-in
    const bi = builtInIcons[shape.iconName] || builtInIcons[shape.type];
    if (bi) {
      const Icon = bi.component;
      return <Icon color={bi.color} size={36} />;
    }
    return <GenericIcon size={36} />;
  };

  const activeShapes = getShapesForCategory(activeCategory);

  return (
    <div
      style={{
        position: 'absolute',
        left: isOpen ? '0' : '-240px',
        top: 0,
        width: '240px',
        height: '100%',
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
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: `${theme.spacing.sm} ${theme.spacing.md}`,
              border: `1px solid ${activeCategory === cat.id ? theme.accent.blue : theme.border.default}`,
              borderRadius: theme.radius.sm,
              background: activeCategory === cat.id ? theme.background.active : theme.background.tertiary,
              color: activeCategory === cat.id ? theme.text.primary : theme.text.secondary,
              cursor: 'pointer',
              fontSize: theme.fontSize.sm,
              fontWeight: theme.fontWeight.medium,
              textTransform: 'capitalize',
              transition: theme.transition.normal
            }}
          >
            {cat.label}
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
        {activeShapes.map((shape) => (
          <button
            key={`${activeCategory}-${shape.iconName}`}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderShapeIcon(shape)}
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
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/reactflow', 'group');
            e.dataTransfer.effectAllowed = 'move';
          }}
          onClick={onAddGroup}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            border: `1px solid ${theme.border.default}`,
            borderRadius: theme.radius.sm,
            background: theme.background.tertiary,
            color: theme.text.primary,
            cursor: 'grab',
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
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow', 'text');
              e.dataTransfer.effectAllowed = 'move';
            }}
            onClick={onAddText}
            style={{
              width: '100%',
              padding: theme.spacing.md,
              border: `1px solid ${theme.border.default}`,
              borderRadius: theme.radius.sm,
              background: theme.background.tertiary,
              color: theme.text.primary,
              cursor: 'grab',
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
        className="panel-glass"
        style={{
          position: 'absolute',
          right: '-30px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '30px',
          height: '60px',
          borderLeft: 'none',
          borderTopRightRadius: theme.radius.md,
          borderBottomRightRadius: theme.radius.md,
          fontSize: theme.fontSize.lg,
          boxShadow: theme.shadow.md,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isOpen ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
      </button>
    </div>
  );
};

export default ShapeLibrary;
