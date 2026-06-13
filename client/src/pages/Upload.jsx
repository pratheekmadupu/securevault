import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiles } from '../contexts/FileContext';
import { useToast } from '../contexts/ToastContext';
import { Upload, FileText, Check, ShieldAlert, Key, RefreshCw } from 'lucide-react';

export default function UploadPage() {
  const { upload } = useFiles();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // idle, encrypting, uploading, success, error
  const [progress, setProgress] = useState(0);
  const [generatedKey, setGeneratedKey] = useState('');
  
  const fileInputRef = useRef(null);

  // Constraints
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
  const ALLOWED_TYPES = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'image/jpeg', 
    'image/png', 
    'application/zip', 
    'application/x-zip-compressed',
    'text/plain'
  ];
  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.zip', '.txt'];

  const validateFile = (file) => {
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      showToast('Unsupported file type. Allowed: PDF, DOCX, JPG, PNG, ZIP, TXT.', 'error');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast('File size exceeds 5MB limit. Please upload a smaller archive.', 'error');
      return false;
    }

    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        // Reset states
        setUploadState('idle');
        setProgress(0);
        setGeneratedKey('');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        // Reset states
        setUploadState('idle');
        setProgress(0);
        setGeneratedKey('');
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const triggerSecureUpload = async () => {
    if (!selectedFile) return;

    setUploadState('encrypting');
    setProgress(10);

    try {
      // Perform upload. The upload context handles keygen and AES encryption.
      // We will hook into the progress updates.
      await upload(selectedFile, (percent) => {
        setProgress(percent);
        if (percent >= 10 && percent < 60) {
          setUploadState('encrypting');
        } else if (percent >= 60 && percent < 100) {
          setUploadState('uploading');
        } else if (percent === 100) {
          setUploadState('success');
        }
      });

      showToast(`${selectedFile.name} encrypted and uploaded successfully.`, 'success');
      setTimeout(() => {
        navigate('/files');
      }, 1500);

    } catch (err) {
      setUploadState('error');
      setProgress(0);
      showToast(err.message || 'Secure upload failed.', 'error');
    }
  };

  const resetSelection = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setProgress(0);
    setGeneratedKey('');
  };

  return (
    <div className="container anim-slide-up" style={{ padding: '30px 24px', maxWidth: '600px' }}>
      
      {/* Title */}
      <header style={{ textAlign: 'left', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
          SECURE <span className="gradient-text">UPLOAD</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Encrypt and upload files to the secure ledger. Maximum file size: 5MB.
        </p>
      </header>

      {/* Main Drag Drop / Upload Area */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        
        {!selectedFile ? (
          /* Drag & Drop Area */
          <div 
            className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".pdf,.docx,.jpg,.jpeg,.png,.zip,.txt"
            />
            <div style={{ background: 'rgba(0, 242, 254, 0.08)', padding: '16px', borderRadius: '50%', color: 'var(--accent-cyan)' }}>
              <Upload size={32} />
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#fff', fontSize: '1rem' }}>Drag & drop document here</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>or click to browse local folders</p>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', width: '100%', paddingTop: '16px', display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Allowed Extensions: PDF, DOCX, JPG, PNG, ZIP, TXT</span>
            </div>
          </div>
        ) : (
          /* File Selected / Uploading Dashboard */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
            
            {/* File Info Block */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(6, 9, 19, 0.4)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ background: 'rgba(79, 172, 254, 0.1)', padding: '12px', borderRadius: '8px', color: 'var(--accent-blue)' }}>
                <FileText size={28} />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              {uploadState === 'idle' && (
                <button 
                  onClick={resetSelection}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Cipher Dashboard (Displays during active encryption/upload) */}
            {uploadState !== 'idle' && (
              <div className="terminal-window">
                <div className="terminal-header">
                  <div className="terminal-dot dot-red"></div>
                  <div className="terminal-dot dot-yellow"></div>
                  <div className="terminal-dot dot-green"></div>
                  <div className="terminal-title">CIPHER STAGE CONTROLLER</div>
                </div>
                <div className="terminal-body" style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* Step 1: Key Gen */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span style={{ color: '#fff' }}>[KEYGEN] Generating 256-bit AES symmetric key...</span>
                    {progress >= 10 && <span style={{ marginLeft: 'auto', color: '#10b981' }}>DONE</span>}
                  </div>
                  
                  {/* Step 2: Encrypting */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} style={{ color: 'var(--accent-blue)', animation: uploadState === 'encrypting' ? 'spin 2s linear infinite' : 'none' }} />
                    <span style={{ color: uploadState === 'encrypting' ? '#fff' : 'var(--text-muted)' }}>[ENCRYPT] AES-256 client-side encryption...</span>
                    {progress >= 60 ? (
                      <span style={{ marginLeft: 'auto', color: '#10b981' }}>DONE</span>
                    ) : uploadState === 'encrypting' ? (
                      <span style={{ marginLeft: 'auto', color: 'var(--accent-blue)' }} className="blink-cursor">ENCRYPTING</span>
                    ) : null}
                  </div>

                  {/* Step 3: Uploading */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Upload size={14} style={{ color: 'var(--accent-purple)' }} />
                    <span style={{ color: uploadState === 'uploading' ? '#fff' : 'var(--text-muted)' }}>[UPLOAD] Streaming encrypted ciphertext to storage...</span>
                    {progress === 100 ? (
                      <span style={{ marginLeft: 'auto', color: '#10b981' }}>COMPLETED</span>
                    ) : uploadState === 'uploading' ? (
                      <span style={{ marginLeft: 'auto', color: 'var(--accent-purple)' }} className="blink-cursor">UPLOADING</span>
                    ) : null}
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>OPERATIONAL PROGRESS</span>
                      <span>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))', boxShadow: '0 0 10px var(--accent-cyan)' }}></div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* CTA Actions */}
            {uploadState === 'idle' && (
              <button 
                onClick={triggerSecureUpload}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', gap: '10px' }}
              >
                <ShieldAlert size={16} /> Encrypt & Send
              </button>
            )}

            {uploadState === 'success' && (
              <div 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  color: 'var(--success)', 
                  padding: '16px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}
              >
                🔒 Operation Complete. Decryption keys saved to metadata vault. Redirecting...
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
