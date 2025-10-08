import React from 'react';
import './Header.css';

const Header = ({ activeTab, setActiveTab, systemHealth }) => {
  const tabs = [
    { id: 'map', label: 'Flood Map' },
    { id: 'predict', label: 'Prediction' }
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>Flood Forecasting System</h1>
          <span className="subtitle">South Sudan Community-Based Early Warning</span>
        </div>
        
        <nav className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="status-indicator">
          <div className={`status-dot ${systemHealth?.status === 'healthy' ? 'online' : 'offline'}`}></div>
          <span className="status-text">
            {systemHealth?.status === 'healthy' ? 'System Online' : 'System Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;