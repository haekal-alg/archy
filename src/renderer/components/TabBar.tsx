import React, { useCallback, useRef } from 'react';
import { useTabContext } from '../contexts/TabContext';
import { TabType } from '../types/terminal';
import theme from '../../theme';

const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, connections } = useTabContext();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const totalCount = connections.length;
  const errorCount = connections.filter(c => c.status === 'error').length;
  const connectingCount = connections.filter(c => c.status === 'connecting').length;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'design', label: 'Design' },
    { id: 'connections', label: 'Connections' },
  ];

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      tabRefs.current[nextIndex]?.focus();
      setActiveTab(tabs[nextIndex].id);
    }
  }, [setActiveTab, tabs]);

  return (
    <div
      role="tablist"
      aria-label="Main navigation"
      style={{
        display: 'flex',
        backgroundColor: theme.background.primary,
        borderBottom: `1px solid ${theme.border.subtle}`,
        padding: `0 ${theme.spacing.xl}`,
        gap: theme.spacing.xs,
      }}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            ref={el => { tabRefs.current[index] = el; }}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              padding: `${theme.spacing.lg} ${theme.spacing.xxxl}`,
              backgroundColor: isActive ? theme.background.secondary : 'transparent',
              color: isActive ? theme.text.primary : theme.text.tertiary,
              border: 'none',
              cursor: 'pointer',
              fontSize: theme.fontSize.base,
              fontWeight: isActive ? theme.fontWeight.semibold : theme.fontWeight.normal,
              transition: 'background-color 150ms ease, color 150ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing.md,
              outline: 'none',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = theme.background.hover;
                e.currentTarget.style.color = theme.text.secondary;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.text.tertiary;
              }
            }}
          >
            {tab.label}

            {/* Connection count badge - colored by most severe status */}
            {tab.id === 'connections' && totalCount > 0 && (
              <span
                className={`tab-badge${errorCount > 0 ? ' pulse-red' : ''}`}
                aria-label={`${totalCount} connection${totalCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} error${errorCount !== 1 ? 's' : ''}` : ''}`}
                style={{
                  backgroundColor: errorCount > 0
                    ? theme.accent.red
                    : connectingCount > 0
                      ? theme.accent.orange
                      : theme.status.success,
                  color: theme.text.inverted,
                }}
              >
                {totalCount}
              </span>
            )}

            {/* Red alert dot when errors exist and user is on another tab */}
            {tab.id === 'connections' && errorCount > 0 && activeTab !== 'connections' && (
              <span
                className="pulse-dot"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: theme.accent.red,
                }}
              />
            )}

            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: theme.spacing.lg,
                right: theme.spacing.lg,
                bottom: '0',
                height: '2px',
                backgroundColor: theme.accent.blue,
                borderRadius: theme.radius.xs,
                transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
                transformOrigin: 'center',
                transition: 'transform 180ms ease',
                pointerEvents: 'none',
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
