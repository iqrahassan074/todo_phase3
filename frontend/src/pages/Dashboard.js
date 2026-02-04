import React, { useState } from 'react';
import ChatInterface from '../components/ChatInterface';
import '../styles/Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{"name": "User"}');

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">✓</div>
            <h2>TodoFlow</h2>
          </div>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            ×
          </button>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">Chat</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <span className="nav-icon">✅</span>
            <span className="nav-text">Tasks</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analytics</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </button>
        </nav>

        <div className="user-profile">
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <h1>TodoFlow Dashboard</h1>
          <div className="header-actions">
            <button className="notification-btn">🔔</button>
            <div className="user-avatar-header">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {activeTab === 'chat' && <ChatInterface />}

          {activeTab === 'tasks' && (
            <div className="tasks-section">
              <div className="section-header">
                <h2>Your Tasks</h2>
                <button className="add-task-btn">+ Add Task</button>
              </div>

              <div className="tasks-list">
                <div className="task-card">
                  <div className="task-content">
                    <h3>Complete project proposal</h3>
                    <p>Finish the proposal document and send to stakeholders</p>
                  </div>
                  <div className="task-meta">
                    <span className="task-status">Pending</span>
                    <span className="task-due">Due: Tomorrow</span>
                  </div>
                </div>

                <div className="task-card completed">
                  <div className="task-content">
                    <h3>Review quarterly reports</h3>
                    <p>Analyze Q4 financial data</p>
                  </div>
                  <div className="task-meta">
                    <span className="task-status completed">Completed</span>
                    <span className="task-due">Completed: Today</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <h2>Analytics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>12</h3>
                  <p>Total Tasks</p>
                </div>
                <div className="stat-card">
                  <h3>8</h3>
                  <p>Completed</p>
                </div>
                <div className="stat-card">
                  <h3>4</h3>
                  <p>Pending</p>
                </div>
                <div className="stat-card">
                  <h3>92%</h3>
                  <p>Success Rate</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <h2>Settings</h2>
              <div className="settings-form">
                <div className="form-group">
                  <label>Notification Preferences</label>
                  <select>
                    <option>All Notifications</option>
                    <option>Only Important</option>
                    <option>None</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Theme</label>
                  <select>
                    <option>Light</option>
                    <option>Dark</option>
                    <option>Auto</option>
                  </select>
                </div>

                <button className="save-settings-btn">Save Settings</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;