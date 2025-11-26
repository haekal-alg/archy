import React, { useEffect } from 'react';
import { ToolType, TOOLS } from '../types/tools';
import { darkTheme } from '../../theme';

// CONFIGURATION: Change this single value to adjust the overall size of the tool palette
// Default: 1.0, Smaller: 0.8, 0.6, Larger: 1.2, 1.5
const PALETTE_SCALE = 0.8;

interface ToolPaletteProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

export const ToolPalette: React.FC<ToolPaletteProps> = ({ activeTool, onToolChange }) => {
  console.log('ToolPalette RENDER - activeTool prop:', activeTool);

  // Force re-render when activeTool changes
  useEffect(() => {
    console.log('ToolPalette useEffect - activeTool changed to:', activeTool);
  }, [activeTool]);

  return (
    <div style={styles.container}>
      <div style={styles.toolGroup}>
        {(Object.keys(TOOLS) as ToolType[]).map((toolType) => {
          const tool = TOOLS[toolType];
          const isActive = activeTool === toolType;
          console.log(`Tool ${toolType}: isActive = ${isActive}, activeTool = ${activeTool}`);

          return (
            <button
              key={toolType}
              onClick={() => onToolChange(toolType)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
              style={{
                ...styles.toolButton,
                ...(isActive ? styles.activeToolButton : {}),
              }}
              title={`${tool.name} (${tool.shortcut})`}
              aria-label={tool.name}
            >
              {/* Icon SVG based on tool type */}
              {toolType === 'selection' && (
                <svg
                  width={20 * PALETTE_SCALE}
                  height={20 * PALETTE_SCALE}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive ? darkTheme.accent.blue : darkTheme.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
              )}
              {toolType === 'hand' && (
                <svg
                  width={20 * PALETTE_SCALE}
                  height={20 * PALETTE_SCALE}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive ? darkTheme.accent.blue : darkTheme.text.primary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                </svg>
              )}
              <span style={styles.shortcutLabel}>{tool.shortcut}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Styles that scale based on PALETTE_SCALE
const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: `${20 * PALETTE_SCALE}px`,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    gap: `${12 * PALETTE_SCALE}px`,
    padding: `${8 * PALETTE_SCALE}px`,
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${darkTheme.border.default}`,
    borderRadius: `${12 * PALETTE_SCALE}px`,
    boxShadow: darkTheme.shadow.lg,
  },
  toolGroup: {
    display: 'flex',
    gap: `${4 * PALETTE_SCALE}px`,
  },
  toolButton: {
    position: 'relative',
    width: `${44 * PALETTE_SCALE}px`,
    height: `${44 * PALETTE_SCALE}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: `1px solid transparent`,
    borderRadius: `${8 * PALETTE_SCALE}px`,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    color: darkTheme.text.primary,
    outline: 'none',
  },
  activeToolButton: {
    background: 'rgba(59, 130, 246, 0.15)',
    border: `1px solid ${darkTheme.accent.blue}`,
    boxShadow: `0 0 ${12 * PALETTE_SCALE}px rgba(59, 130, 246, 0.3)`,
  },
  shortcutLabel: {
    position: 'absolute',
    bottom: `${2 * PALETTE_SCALE}px`,
    right: `${2 * PALETTE_SCALE}px`,
    fontSize: `${9 * PALETTE_SCALE}px`,
    fontWeight: 600,
    color: darkTheme.text.secondary,
    background: 'rgba(0, 0, 0, 0.6)',
    padding: `${1 * PALETTE_SCALE}px ${3 * PALETTE_SCALE}px`,
    borderRadius: `${3 * PALETTE_SCALE}px`,
  },
};
