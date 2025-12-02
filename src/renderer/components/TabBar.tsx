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
      backgroundColor: '#1e1e1e',
      borderBottom: '1px solid #333',
      padding: '0 16px',
      gap: '4px',
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === tab.id ? '#2d2d2d' : 'transparent',
            color: activeTab === tab.id ? '#fff' : '#888',
            border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid #007acc' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? '600' : '400',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = '#252525';
              e.currentTarget.style.color = '#ccc';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#888';
            }
          }}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span style={{
              backgroundColor: '#16825d',
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
        </button>
      ))}
    </div>
  );
};

export default TabBar;
