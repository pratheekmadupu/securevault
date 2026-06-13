import React, { useEffect, useState } from 'react';
import { useFiles } from '../contexts/FileContext';
import { useToast } from '../contexts/ToastContext';
import { Share2, Trash2, Clock, Calendar, CheckCircle2, AlertTriangle, Link2 } from 'lucide-react';

export default function SharedFiles() {
  const { files, revokeShare } = useFiles();
  const { showToast } = useToast();
  
  const [activeShares, setActiveShares] = useState([]);
  const [revokingId, setRevokingId] = useState(null);

  useEffect(() => {
    // Collect all files with sharing information
    const sharesList = [];
    files.forEach(file => {
      if (file.sharing && file.sharing.active) {
        sharesList.push({
          fileId: file.id,
          fileName: file.name,
          fileSize: file.size,
          shareId: file.sharing.shareId,
          expiresAt: file.sharing.expiresAt,
          createdAt: file.sharing.createdAt
        });
      }
    });

    // Sort by expiration (closest first)
    sharesList.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
    setActiveShares(sharesList);
  }, [files]);

  const handleRevoke = async (shareId, fileName) => {
    if (!window.confirm(`⚠️ WARNING: Revoke shared access to ${fileName}? Access tunnels will be terminated immediately.`)) return;

    setRevokingId(shareId);
    try {
      await revokeShare(shareId);
      showToast(`Shared pipeline for ${fileName} revoked.`, 'info');
    } catch (err) {
      showToast(err.message || 'Revocation failed.', 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const copyShareLink = (shareId) => {
    const fullUrl = `${window.location.origin}/shared-view/${shareId}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('Link copied to clipboard.', 'success');
  };

  return (
    <div className="container anim-fade" style={{ padding: '30px 24px' }}>
      
      {/* Title */}
      <header style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
          ACTIVE <span className="gradient-text">SHARING PIPELINES</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Review and control access links. Revoking access will invalidate the decryption pipelines immediately.
        </p>
      </header>

      {/* Grid List */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        
        {activeShares.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Share2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No active sharing tunnels catalogued.</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Create pipelines from the File Catalog to provision temporary links.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Resource Name</th>
                  <th>Portal Expiry</th>
                  <th>Provisioned On</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeShares.map((share) => {
                  const isExpired = new Date(share.expiresAt) < new Date();
                  
                  return (
                    <tr key={share.shareId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Share2 size={16} style={{ color: 'var(--accent-cyan)' }} />
                          <div>
                            <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{share.fileName}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ID: {share.shareId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} style={{ color: isExpired ? 'var(--danger)' : 'var(--accent-cyan)' }} />
                          <span>{new Date(share.expiresAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                          <Calendar size={14} />
                          <span>{new Date(share.createdAt).toLocaleString()}</span>
                        </div>
                      </td>
                      <td>
                        {isExpired ? (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', gap: '4px' }}>
                            <AlertTriangle size={10} /> EXPIRES
                          </span>
                        ) : (
                          <span className="badge badge-success" style={{ display: 'inline-flex', gap: '4px' }}>
                            <CheckCircle2 size={10} /> TUNNEL ACTIVE
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          
                          <button
                            onClick={() => copyShareLink(share.shareId)}
                            className="btn-icon-only"
                            title="Copy Access Link"
                          >
                            <Link2 size={14} />
                          </button>

                          <button
                            onClick={() => handleRevoke(share.shareId, share.fileName)}
                            className="btn-icon-only"
                            style={{ color: 'var(--danger)' }}
                            title="Revoke Portal Access"
                            disabled={revokingId === share.shareId}
                          >
                            <Trash2 size={14} />
                          </button>

                        </div>
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
