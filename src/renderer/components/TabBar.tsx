import React from 'react';
import { useTabContext } from '../contexts/TabContext';
import { TabType } from '../types/terminal';

const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, connections } = useTabContext();

  const activeConnections = connections.filter(c => c.status === 'connected').length;

  const tabs: { id: TabType; label: string; badge?: number }[] = [
    { id: 'design', label: 'Design' },
    { id: 'connections', label: 'Connections', badge: activeConnections > 0 ? activeConnections : undefined },
  ];

  return (
    <div style={{
      display: 'flex',
      backgroundColor: '#1a1f25',
      borderBottom: '1px solid #2a333d',
      padding: '0 16px',
      gap: '4px',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === tab.id ? '#242c34' : 'transparent',
            color: activeTab === tab.id ? '#e6edf3' : '#8b97a3',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? '600' : '400',
            transition: 'background-color 160ms ease, color 160ms ease, transform 120ms ease, border-bottom-color 160ms ease, box-shadow 160ms ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
              e.currentTarget.style.backgroundColor = '#2a323b';
              e.currentTarget.style.color = '#c4ced8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#8b97a3';
            }
          }}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span style={{
              backgroundColor: '#1f6f5c',
              color: '#fff',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: '600',
              minWidth: '20px',
              textAlign: 'center',
            }}>
              {tab.badge}
            </span>
          )}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: '12px',
              right: '12px',
              bottom: '0',
              height: '2px',
              backgroundColor: '#2f81f7',
              borderRadius: '2px',
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
