import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { decryptFile, downloadDecryptedFile } from '../services/crypto';
import { useToast } from '../contexts/ToastContext';
import { ShieldAlert, FileText, Download, ShieldCheck, Clock, Eye } from 'lucide-react';

export default function SharedView() {
  const { shareId } = useParams();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sharedData, setSharedData] = useState(null); // name, size, type, ciphertext, key, expiresAt
  const [decryptedDataUrl, setDecryptedDataUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  useEffect(() => {
    const fetchSharedPayload = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await api.sharing.getSharedFile(shareId);
        setSharedData(data);
      } catch (err) {
        setError(err.message || 'Shared resource inaccessible, expired, or revoked.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedPayload();
  }, [shareId]);

  const handleDecryptAndDownload = async () => {
    if (!sharedData) return;
    setDownloading(true);
    try {
      showToast('Initiating client-side AES-256 decryption...', 'info');
      
      // Decrypt on the fly
      const decrypted = decryptFile(sharedData.ciphertext, sharedData.encryptionKey);
      
      // Trigger download
      downloadDecryptedFile(decrypted, sharedData.name);
      showToast('Decryption complete. Document retrieved.', 'success');
    } catch (err) {
      showToast(err.message || 'Decryption failed. Integrity check failed.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleTogglePreview = () => {
    if (isPreviewVisible) {
      setIsPreviewVisible(false);
      return;
    }

    try {
      if (!decryptedDataUrl) {
        showToast('Decrypting payload in-memory...', 'info');
        const decrypted = decryptFile(sharedData.ciphertext, sharedData.encryptionKey);
        setDecryptedDataUrl(decrypted);
      }
      setIsPreviewVisible(true);
    } catch (err) {
      showToast(err.message || 'Decryption failed.', 'error');
    }
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px' }}></div>
          <div className="skeleton" style={{ width: '250px', height: '24px', margin: '0 auto 12px' }}></div>
          <div className="skeleton" style={{ width: '150px', height: '16px', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container anim-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', padding: '40px 24px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(239, 68, 68, 0.08)', padding: '16px', borderRadius: '50%', color: 'var(--danger)', marginBottom: '20px' }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--danger)', marginBottom: '12px' }}>DECRYPTION TUNNEL DENIED</h2>
          <div 
            style={{ 
              background: 'rgba(239, 68, 68, 0.05)', 
              padding: '16px', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              lineHeight: '1.6',
              textAlign: 'left'
            }}
          >
            🔒 Access to the shared resource failed security audits. Reasons may include:
            <ul style={{ paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>The sharing link duration has expired.</li>
              <li>The owner has revoked sharing permissions.</li>
              <li>Insecure Direct Object Reference validation failed.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container anim-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', padding: '40px 24px', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px 32px', textAlign: 'center' }}>
        
        {/* Verification stamp */}
        <div style={{ display: 'inline-flex', background: 'rgba(0, 242, 254, 0.08)', padding: '16px', borderRadius: '50%', color: 'var(--accent-cyan)', marginBottom: '20px' }}>
          <ShieldCheck size={36} />
        </div>

        <h2 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>DOCUMENT PIPELINE VERIFIED</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The requested cryptographic payload has passed origin integrity checks.
        </p>

        {/* File Metadata block */}
        <div style={{ background: 'rgba(6, 9, 19, 0.5)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem', wordBreak: 'break-all' }}>{sharedData.name}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Size:</span>
            <strong>{formatBytes(sharedData.size)}</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span>Type:</span>
            <strong>{sharedData.type.split('/')[1]?.toUpperCase() || 'FILE'}</strong>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--warning)' }}>
            <Clock size={12} />
            <span>Portal expires on: {new Date(sharedData.expiresAt).toLocaleString()}</span>
          </div>

        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <button 
            onClick={handleDecryptAndDownload}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px 20px', gap: '8px' }}
            disabled={downloading}
          >
            <Download size={16} /> {downloading ? 'Decrypting payload...' : 'Decrypt & Download'}
          </button>

          {(sharedData.type.startsWith('image/') || sharedData.type === 'text/plain') && (
            <button 
              onClick={handleTogglePreview}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '10px 20px', gap: '8px' }}
            >
              <Eye size={16} /> {isPreviewVisible ? 'Hide Decrypted Preview' : 'Preview Document'}
            </button>
          )}

        </div>

      </div>

      {/* Render preview inline if visible */}
      {isPreviewVisible && decryptedDataUrl && (
        <div className="glass-panel anim-fade" style={{ width: '100%', maxWidth: '700px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <h3 style={{ fontSize: '0.95rem', alignSelf: 'flex-start', marginBottom: '16px', color: 'var(--accent-cyan)' }}>DECRYPTED MEMORY PREVIEW:</h3>
          {sharedData.type.startsWith('image/') ? (
            <img 
              src={decryptedDataUrl} 
              alt={sharedData.name} 
              style={{ maxWidth: '100%', maxHeight: '50vh', borderRadius: '6px', border: '1px solid var(--border-color)' }} 
            />
          ) : (
            <iframe 
              src={decryptedDataUrl} 
              title={sharedData.name} 
              style={{ width: '100%', height: '40vh', border: '1px solid var(--border-color)', borderRadius: '6px', background: '#fff', color: '#000' }}
            />
          )}
        </div>
      )}

    </div>
  );
}
