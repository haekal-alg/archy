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

            {/* Connection count badge with status icon for accessibility */}
            {tab.id === 'connections' && totalCount > 0 && (
              <span
                className={`tab-badge${errorCount > 0 ? ' pulse-red' : ''}`}
                aria-label={`${totalCount} connection${totalCount !== 1 ? 's' : ''}${errorCount > 0 ? `, ${errorCount} error${errorCount !== 1 ? 's' : ''}` : ''}`}
                style={{
                  backgroundColor: errorCount > 0
                    ? 'rgba(255, 92, 92, 0.15)'
                    : connectingCount > 0
                      ? 'rgba(255, 171, 64, 0.15)'
                      : 'rgba(61, 214, 140, 0.15)',
                  color: errorCount > 0
                    ? '#e87272'
                    : connectingCount > 0
                      ? '#d4943a'
                      : '#5ab882',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {/* Status icon: differentiates states beyond color alone */}
                {errorCount > 0 ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M5 1L9 9H1L5 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    <line x1="5" y1="4" x2="5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    <circle cx="5" cy="7.5" r="0.5" fill="currentColor" />
                  </svg>
                ) : connectingCount > 0 ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ animation: 'spin 1.5s linear infinite' }}>
                    <path d="M5 1A4 4 0 0 1 9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path d="M2 5L4.5 7.5L8 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {totalCount}
              </span>
            )}

            {/* Alert dot when errors exist and user is on another tab */}
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
                  backgroundColor: '#e87272',
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
