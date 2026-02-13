import React from 'react';
import { useTabContext } from '../contexts/TabContext';
import { TabType } from '../types/terminal';
import theme from '../../theme';

const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, connections } = useTabContext();

  const totalCount = connections.length;
  const errorCount = connections.filter(c => c.status === 'error').length;
  const connectingCount = connections.filter(c => c.status === 'connecting').length;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'design', label: 'Design' },
    { id: 'connections', label: 'Connections' },
  ];

  return (
    <div style={{
      display: 'flex',
      backgroundColor: theme.background.primary,
      borderBottom: `1px solid ${theme.border.subtle}`,
      padding: `0 ${theme.spacing.xl}`,
      gap: theme.spacing.xs,
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: `${theme.spacing.lg} ${theme.spacing.xxxl}`,
            backgroundColor: activeTab === tab.id ? theme.background.secondary : 'transparent',
            color: activeTab === tab.id ? theme.text.primary : theme.text.tertiary,
            border: 'none',
            cursor: 'pointer',
            fontSize: theme.fontSize.base,
            fontWeight: activeTab === tab.id ? theme.fontWeight.semibold : theme.fontWeight.normal,
            transition: 'background-color 160ms ease, color 160ms ease, transform 120ms ease, border-bottom-color 160ms ease, box-shadow 160ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.md,
            outline: 'none',
            position: 'relative',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
            e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.06)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = theme.background.hover;
              e.currentTarget.style.color = theme.text.secondary;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
            if (activeTab !== tab.id) {
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
              style={{
                backgroundColor: errorCount > 0
                  ? theme.accent.red
                  : connectingCount > 0
                    ? theme.accent.orange
                    : theme.accent.greenDark,
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
            aria-hidden
            style={{
              position: 'absolute',
              left: theme.spacing.lg,
              right: theme.spacing.lg,
              bottom: '0',
              height: '2px',
              backgroundColor: theme.accent.blue,
              borderRadius: theme.radius.xs,
              transform: activeTab === tab.id ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'center',
              transition: 'transform 180ms ease',
              pointerEvents: 'none',
            }}
          />
        </button>
      ))}
    </div>
  );
};

export default TabBar;
