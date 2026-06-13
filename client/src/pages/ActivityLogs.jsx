import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Shield, RefreshCw, Filter, Search } from 'lucide-react';

export default function ActivityLogs() {
  const { logs, refreshLogs } = useAuth();
  
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshLogs();
    } finally {
      setRefreshing(false);
    }
  };

  // Extract unique actions for filter options
  const uniqueActions = ['ALL', ...new Set(logs.map(log => log.action))];

  const filteredLogs = logs
    .filter(log => {
      const matchAction = filterAction === 'ALL' || log.action === filterAction;
      const matchSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.status.toLowerCase().includes(searchTerm.toLowerCase());
      return matchAction && matchSearch;
    })
    // Newest logs first
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div className="container anim-fade" style={{ padding: '30px 24px' }}>
      
      {/* Title */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            SECURITY <span className="gradient-text">AUDIT TRAIL</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Tamper-evident log register tracking all document transactions and authentications.
          </p>
        </div>

        <button 
          onClick={handleRefresh} 
          className="btn btn-secondary" 
          disabled={refreshing}
          style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Ledgers
        </button>
      </header>

      {/* Filter toolbar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        
        {/* Search */}
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px', paddingTop: '10px', paddingBottom: '10px' }}
            placeholder="Search details or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)' }}>ACTION FILTER:</span>
          <select
            className="form-input"
            style={{ width: '180px', paddingTop: '10px', paddingBottom: '10px', background: 'var(--bg-secondary)' }}
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            {uniqueActions.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <ClipboardList size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No audit events found matching filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="cyber-table" style={{ fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>Origin IP</th>
                  <th>Telemetry Agent</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS' || log.status === 'OK';
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.6rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ maxWidth: '300px', wordBreak: 'break-all' }}>{log.details}</td>
                      <td>{log.ipAddress || '127.0.0.1'}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.userAgent}>
                        {log.userAgent || 'WebBrowser Console'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={`badge ${isSuccess ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
