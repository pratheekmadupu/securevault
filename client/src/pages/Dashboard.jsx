import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFiles } from '../contexts/FileContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  FileText, Database, Share2, ClipboardList, 
  Upload, Settings, HardDrive, Terminal, Shield, ArrowRight, Download 
} from 'lucide-react';

export default function Dashboard() {
  const { files, download, loading: filesLoading } = useFiles();
  const { user, logs, refreshLogs } = useAuth();
  const { showToast } = useToast();

  const [recentFiles, setRecentFiles] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);

  // Storage Quota configuration (e.g. 50 MB)
  const MAX_STORAGE_BYTES = 50 * 1024 * 1024; 

  useEffect(() => {
    // Take the 5 most recent files
    const sorted = [...files].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setRecentFiles(sorted.slice(0, 5));
  }, [files]);

  useEffect(() => {
    refreshLogs();
  }, []);

  // Compute total storage used
  const totalStorageUsed = files.reduce((acc, curr) => acc + parseInt(curr.size || 0), 0);
  
  // Format bytes
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const storagePercentage = Math.min(((totalStorageUsed / MAX_STORAGE_BYTES) * 100), 100).toFixed(1);

  // Compute active shares count
  const activeSharesCount = files.filter(f => f.sharing && f.sharing.active).length;

  const handleDownload = async (fileId, fileName) => {
    setDownloadingId(fileId);
    try {
      showToast(`Initializing secure download & decryption for ${fileName}...`, 'info');
      await download(fileId);
      showToast(`${fileName} decrypted and downloaded successfully.`, 'success');
    } catch (err) {
      showToast(err.message || 'Download failed.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container anim-fade" style={{ padding: '30px 24px' }}>
      
      {/* Welcome Banner */}
      <header style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: '700' }}>
            OPERATOR <span className="gradient-text">CONSOLE</span>
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Welcome back, <strong>{user?.displayName}</strong>. Accessing node from: {user?.email}
          </p>
        </div>
        
        {/* Quick Action Bar */}
        <div style={{ display: 'flex', gap: '12px', marginLeft: 'auto' }}>
          <Link to="/upload" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            <Upload size={14} /> Upload File
          </Link>
          <Link to="/profile" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            <Settings size={14} /> Config
          </Link>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-container" style={{ marginBottom: '32px' }}>
        
        {/* Total Files */}
        <div className="glass-panel stat-card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)' }}>ENCRYPTED ARCHIVES</span>
            <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="stat-val">{files.length}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure documents catalogued</p>
        </div>

        {/* Storage Quota */}
        <div className="glass-panel stat-card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)' }}>STORAGE LOAD</span>
            <HardDrive size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="stat-val">{formatBytes(totalStorageUsed)}</div>
          
          {/* Quota Progress Bar */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '6px' }}>
            <div style={{ 
              width: `${storagePercentage}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))',
              boxShadow: '0 0 8px var(--accent-cyan)'
            }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            <span>{storagePercentage}% allocated</span>
            <span>of 50 MB Limit</span>
          </div>
        </div>

        {/* Active Shares */}
        <div className="glass-panel stat-card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)' }}>ACTIVE PORTALS</span>
            <Share2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-val" style={{ color: '#10b981', textShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>{activeSharesCount}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shared document pipelines active</p>
        </div>

        {/* Audits logged */}
        <div className="glass-panel stat-card" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)' }}>AUDIT LOG ENTRIES</span>
            <ClipboardList size={18} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="stat-val" style={{ color: 'var(--accent-purple)', textShadow: '0 0 10px rgba(127, 0, 255, 0.2)' }}>{logs.length}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tamper-evident logs generated</p>
        </div>

      </section>

      {/* Split Console Grid */}
      <div className="dashboard-grid">
        
        {/* Recent Files Panel */}
        <div className="col-8 glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: 'var(--accent-cyan)' }} />
              RECENT SECURE DOCUMENTS
            </h3>
            <Link to="/files" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Catalog <ArrowRight size={12} />
            </Link>
          </div>

          {filesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton" style={{ height: '40px', width: '100%' }}></div>
              <div className="skeleton" style={{ height: '40px', width: '100%' }}></div>
              <div className="skeleton" style={{ height: '40px', width: '100%' }}></div>
            </div>
          ) : recentFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
              <FileText size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No encrypted archives exist in local ledger.</p>
              <Link to="/upload" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none', marginTop: '8px', display: 'inline-block' }}>
                Upload first file
              </Link>
            </div>
          ) : (
            <div className="table-container">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Size</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFiles.map((file) => (
                    <tr key={file.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                          <span style={{ fontWeight: '500', color: '#fff', wordBreak: 'break-all' }}>{file.name}</span>
                        </div>
                      </td>
                      <td>{formatBytes(file.size)}</td>
                      <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDownload(file.id, file.name)}
                          className="btn-icon-only"
                          title="Decrypt and Download"
                          disabled={downloadingId === file.id}
                        >
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Terminal Audit Panel */}
        <div className="col-4 terminal-window" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="terminal-header">
            <div className="terminal-dot dot-red"></div>
            <div className="terminal-dot dot-yellow"></div>
            <div className="terminal-dot dot-green"></div>
            <div className="terminal-title">LIVE SYSTEM AUDIT FEED</div>
          </div>
          
          <div className="terminal-body" style={{ flex: 1, overflowY: 'auto', maxHeight: '350px', fontSize: '0.8rem' }}>
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                &lt;No log records generated yet&gt;
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.slice(0, 7).map((log) => (
                  <div key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      [{new Date(log.timestamp).toLocaleTimeString()}] IP: {log.ipAddress || '127.0.0.1'}
                    </div>
                    <div style={{ color: log.status === 'ERROR' || log.status === 'FAILED' ? 'var(--danger)' : '#10b981' }}>
                      {log.action} - {log.status}
                    </div>
                    {log.details && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', overflowWrap: 'break-word' }}>
                        &gt; {log.details}
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <Link to="/logs" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontSize: '0.75rem' }}>
                    View complete security trail
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
