import React from 'react';
import { KeyboardIcon } from './StatusIcons';
import theme from '../../theme';

interface Shortcut {
  key: string;
  description: string;
  category: 'Navigation' | 'Editing' | 'Tools' | 'View';
}

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { key: 'Ctrl/⌘ + 1', description: 'Switch to Design tab', category: 'Navigation' },
  { key: 'Ctrl/⌘ + 2', description: 'Switch to Connections tab', category: 'Navigation' },
  { key: 'Space + Drag', description: 'Pan canvas', category: 'Navigation' },
  { key: 'Mouse Wheel', description: 'Zoom in/out', category: 'Navigation' },
  { key: 'Middle Click + Drag', description: 'Pan canvas', category: 'Navigation' },

  // Editing
  { key: 'Ctrl/⌘ + Z', description: 'Undo', category: 'Editing' },
  { key: 'Ctrl/⌘ + Y', description: 'Redo', category: 'Editing' },
  { key: 'Ctrl/⌘ + Shift + Z', description: 'Redo (alternative)', category: 'Editing' },
  { key: 'Delete', description: 'Delete selected', category: 'Editing' },
  { key: 'Ctrl + A', description: 'Select all', category: 'Editing' },

  // Tools
  { key: 'V', description: 'Selection tool', category: 'Tools' },
  { key: 'H', description: 'Hand tool', category: 'Tools' },
  { key: 'Esc', description: 'Deselect all', category: 'Tools' },

  // View
  { key: '?', description: 'Show keyboard shortcuts', category: 'View' },
  { key: 'Esc', description: 'Close modal', category: 'View' },
];

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  const categoryOrder: Array<'Navigation' | 'Editing' | 'Tools' | 'View'> = ['Navigation', 'Editing', 'Tools', 'View'];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          background: theme.background.elevated,
          borderRadius: theme.radius.xl,
          padding: theme.spacing.xxxl,
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: theme.shadow.xl,
          border: `1px solid ${theme.border.default}`,
          animation: 'modalEnter 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          marginBottom: theme.spacing.xxxl,
          borderBottom: `1px solid ${theme.border.subtle}`,
          paddingBottom: theme.spacing.lg,
        }}>
          <h2 style={{
            margin: 0,
            fontSize: theme.fontSize.xxl,
            fontWeight: theme.fontWeight.bold,
            color: theme.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.lg,
          }}>
            <KeyboardIcon size={24} color={theme.text.primary} />
            Keyboard Shortcuts
          </h2>
        </div>

        {/* Shortcuts by Category */}
        {categoryOrder.map((category) => {
          const categoryShortcuts = groupedShortcuts[category];
          if (!categoryShortcuts) return null;

          return (
            <div key={category} style={{ marginBottom: theme.spacing.xxxl }}>
              <h3 style={{
                fontSize: theme.fontSize.lg,
                fontWeight: theme.fontWeight.semibold,
                color: theme.accent.blue,
                marginBottom: theme.spacing.lg,
                marginTop: 0,
              }}>
                {category}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
                      background: theme.background.secondary,
                      borderRadius: theme.radius.md,
                      transition: theme.transition.fast,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme.background.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme.background.secondary;
                    }}
                  >
                    <span style={{
                      fontSize: theme.fontSize.md,
                      color: theme.text.secondary,
                    }}>
                      {shortcut.description}
                    </span>

                    {/* Keyboard key styling */}
                    <kbd style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
                      background: theme.background.tertiary,
                      border: `1px solid ${theme.border.default}`,
                      borderRadius: theme.radius.sm,
                      fontSize: theme.fontSize.sm,
                      fontFamily: 'monospace',
                      fontWeight: theme.fontWeight.semibold,
                      color: theme.text.primary,
                      boxShadow: `0 2px 0 ${theme.border.subtle}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Close button */}
        <div style={{
          marginTop: theme.spacing.xxxl,
          paddingTop: theme.spacing.lg,
          borderTop: `1px solid ${theme.border.subtle}`,
          textAlign: 'center',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: `${theme.spacing.md} ${theme.spacing.xxxl}`,
              background: theme.gradient.button,
              color: theme.text.primary,
              border: 'none',
              borderRadius: theme.radius.md,
              fontSize: theme.fontSize.md,
              fontWeight: theme.fontWeight.semibold,
              cursor: 'pointer',
              transition: theme.transition.normal,
              boxShadow: theme.shadow.md,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.gradient.buttonHover;
              e.currentTarget.style.boxShadow = theme.shadow.lg;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.gradient.button;
              e.currentTarget.style.boxShadow = theme.shadow.md;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes modalEnter {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          /* Custom scrollbar for modal */
          div::-webkit-scrollbar {
            width: 8px;
          }

          div::-webkit-scrollbar-track {
            background: ${theme.background.secondary};
            border-radius: ${theme.radius.sm};
          }

          div::-webkit-scrollbar-thumb {
            background: ${theme.border.default};
            border-radius: ${theme.radius.sm};
          }

          div::-webkit-scrollbar-thumb:hover {
            background: ${theme.border.strong};
          }
        `}
      </style>
    </div>
  );
};

export default KeyboardShortcuts;
