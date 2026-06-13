import React, { useState } from 'react';
import { useFiles } from '../contexts/FileContext';
import { useToast } from '../contexts/ToastContext';
import { 
  FileText, Download, Trash2, Edit, Share2, Search, 
  ChevronUp, ChevronDown, Eye, X, ShieldAlert, Key, Clock 
} from 'lucide-react';

export default function FileManagement() {
  const { files, download, preview, rename, deleteFile, share } = useFiles();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, size-desc, size-asc, name
  
  // Modals
  const [previewFile, setPreviewFile] = useState(null); // file data url, name, type
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const [shareFileId, setShareFileId] = useState(null);
  const [shareDuration, setShareDuration] = useState('24'); // hours: 1, 24, 168
  const [generatedShareUrl, setGeneratedShareUrl] = useState('');

  const [renameFileId, setRenameFileId] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Helper formatting size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Sort & Search operations
  const filteredFiles = files
    .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'size-desc') return b.size - a.size;
      if (sortBy === 'size-asc') return a.size - b.size;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  // Action Triggers
  const handleDownload = async (fileId, fileName) => {
    setDownloadingId(fileId);
    try {
      showToast(`Decrypting payload: ${fileName}...`, 'info');
      await download(fileId);
      showToast('Decryption complete. Document saved.', 'success');
    } catch (err) {
      showToast(err.message || 'Decryption failed.', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (file) => {
    setPreviewLoading(true);
    setPreviewFile(null);
    try {
      showToast(`Decrypting file content for preview...`, 'info');
      const decrypted = await preview(file.id);
      setPreviewFile(decrypted);
    } catch (err) {
      showToast(err.message || 'Decryption failed.', 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameVal.trim() || !renameFileId) return;

    try {
      await rename(renameFileId, renameVal);
      showToast('Document renamed successfully.', 'success');
      setRenameFileId(null);
    } catch (err) {
      showToast(err.message || 'Rename failed.', 'error');
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`⚠️ WARNING: Securely delete ${fileName}? This action is irreversible.`)) return;

    setDeletingId(fileId);
    try {
      await deleteFile(fileId);
      showToast('Document shredded from cloud storage.', 'success');
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareFileId) return;

    try {
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(shareDuration));

      const shareUrl = await share(shareFileId, expiresAt.toISOString());
      
      // Compute full URL
      const fullUrl = `${window.location.origin}/shared-view/${shareUrl.split('/').pop()}`;
      setGeneratedShareUrl(fullUrl);
      showToast('Cryptographic sharing link generated.', 'success');
    } catch (err) {
      showToast(err.message || 'Sharing link generation failed.', 'error');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedShareUrl);
    showToast('Copied share link to clipboard.', 'success');
  };

  return (
    <div className="container anim-fade" style={{ padding: '30px 24px' }}>
      
      {/* Title */}
      <header style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
          SECURE <span className="gradient-text">FILES</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Manage your E2EE file archive, download, decrypt, or share resources securely.
        </p>
      </header>

      {/* Filter Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        
        {/* Search */}
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '42px', paddingTop: '10px', paddingBottom: '10px' }}
            placeholder="Search documents by filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)' }}>SORT BY:</span>
          <select
            className="form-input"
            style={{ width: '180px', paddingTop: '10px', paddingBottom: '10px', background: 'var(--bg-secondary)' }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Upload Date (Newest)</option>
            <option value="date-asc">Upload Date (Oldest)</option>
            <option value="size-desc">File Size (Largest)</option>
            <option value="size-asc">File Size (Smallest)</option>
            <option value="name">File Name (A-Z)</option>
          </select>
        </div>

      </div>

      {/* File Catalog Ledger */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {filteredFiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>No documents found matching search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded At</th>
                  <th style={{ textAlign: 'right' }}>Controls</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
                        <div>
                          <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem', wordBreak: 'break-all' }}>{file.name}</span>
                          {file.sharing && file.sharing.active && (
                            <span className="badge badge-success" style={{ fontSize: '0.55rem', marginLeft: '8px' }}>SHARED</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                        {file.type.split('/')[1]?.toUpperCase() || file.type.split('/')[0]?.toUpperCase() || 'FILE'}
                      </span>
                    </td>
                    <td>{formatBytes(file.size)}</td>
                    <td>{new Date(file.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        
                        {/* Preview */}
                        <button
                          onClick={() => handlePreview(file)}
                          className="btn-icon-only"
                          title="Decrypt & Preview"
                          disabled={previewLoading}
                        >
                          <Eye size={14} />
                        </button>

                        {/* Download */}
                        <button
                          onClick={() => handleDownload(file.id, file.name)}
                          className="btn-icon-only"
                          title="Decrypt & Download"
                          disabled={downloadingId === file.id}
                        >
                          <Download size={14} />
                        </button>

                        {/* Rename */}
                        <button
                          onClick={() => {
                            setRenameFileId(file.id);
                            setRenameVal(file.name);
                          }}
                          className="btn-icon-only"
                          title="Rename Document"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Share */}
                        <button
                          onClick={() => {
                            setShareFileId(file.id);
                            setGeneratedShareUrl('');
                          }}
                          className="btn-icon-only"
                          title="Secure Share"
                        >
                          <Share2 size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(file.id, file.name)}
                          className="btn-icon-only"
                          style={{ color: 'var(--danger)' }}
                          title="Secure Shred"
                          disabled={deletingId === file.id}
                        >
                          <Trash2 size={14} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Preview File */}
      {previewFile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(6, 9, 19, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', wordBreak: 'break-all' }}>DECRYPTED PREVIEW: {previewFile.name}</h3>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              {previewFile.type.startsWith('image/') ? (
                <img 
                  src={previewFile.dataUrl} 
                  alt={previewFile.name} 
                  style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                />
              ) : previewFile.type === 'text/plain' ? (
                <iframe 
                  src={previewFile.dataUrl} 
                  title={previewFile.name} 
                  style={{ width: '100%', height: '50vh', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fff', color: '#000' }}
                />
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <ShieldAlert size={48} style={{ color: 'var(--accent-cyan)' }} />
                  <p>Direct previews are not supported for this document type (<strong>{previewFile.type}</strong>).</p>
                  <button 
                    onClick={() => {
                      downloadDecryptedFile(previewFile.dataUrl, previewFile.name);
                      setPreviewFile(null);
                    }}
                    className="btn btn-primary"
                  >
                    Decrypt & Download Locally
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal - Rename File */}
      {renameFileId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(6, 9, 19, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem' }}>RENAME DOCUMENT</h3>
              <button onClick={() => setRenameFileId(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleRenameSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="renameVal">Document Label</label>
                <input
                  id="renameVal"
                  type="text"
                  className="form-input"
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setRenameFileId(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Secure Share File */}
      {shareFileId && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(6, 9, 19, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '24px', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={16} style={{ color: 'var(--accent-cyan)' }} />
                GENERATE SHARE PIPELINE
              </h3>
              <button onClick={() => setShareFileId(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {!generatedShareUrl ? (
              <form onSubmit={handleShareSubmit}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Generate an authenticated temporal link to share access to this document. The client can download and decrypt the file directly.
                </p>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Link Expiration (Lifespan)</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{ flex: 1, padding: '10px', background: shareDuration === '1' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0,0,0,0.2)', border: shareDuration === '1' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', display: 'block' }}>
                      <input type="radio" name="expiry" value="1" checked={shareDuration === '1'} onChange={() => setShareDuration('1')} style={{ display: 'none' }} />
                      <Clock size={12} style={{ marginBottom: '4px' }} />
                      <div>1 Hour</div>
                    </label>
                    <label style={{ flex: 1, padding: '10px', background: shareDuration === '24' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0,0,0,0.2)', border: shareDuration === '24' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', display: 'block' }}>
                      <input type="radio" name="expiry" value="24" checked={shareDuration === '24'} onChange={() => setShareDuration('24')} style={{ display: 'none' }} />
                      <Clock size={12} style={{ marginBottom: '4px' }} />
                      <div>24 Hours</div>
                    </label>
                    <label style={{ flex: 1, padding: '10px', background: shareDuration === '168' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(0,0,0,0.2)', border: shareDuration === '168' ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', display: 'block' }}>
                      <input type="radio" name="expiry" value="168" checked={shareDuration === '168'} onChange={() => setShareDuration('168')} style={{ display: 'none' }} />
                      <Clock size={12} style={{ marginBottom: '4px' }} />
                      <div>7 Days</div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={() => setShareFileId(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Pipeline</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--success)' }}>
                  🔒 Secure link generated successfully. Anyone with the link can view/decrypt this resource until expiration.
                </div>
                
                <div className="form-group">
                  <label className="form-label">Temporary Access URL</label>
                  <input
                    type="text"
                    className="form-input"
                    value={generatedShareUrl}
                    readOnly
                    onClick={copyToClipboard}
                    style={{ cursor: 'pointer', background: 'rgba(0,0,0,0.3)', color: 'var(--accent-cyan)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={copyToClipboard} className="btn btn-primary" style={{ flex: 1 }}>Copy Link</button>
                  <button onClick={() => setShareFileId(null)} className="btn btn-secondary" style={{ flex: 1 }}>Done</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
