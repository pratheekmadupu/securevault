import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Key, EyeOff, Share2, ClipboardList, Database, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="container anim-fade" style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', gap: '80px' }}>
      
      {/* Hero Section */}
      <header style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div 
          className="glass-panel" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '6px 16px', 
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-cyber)',
            color: 'var(--accent-cyan)',
            border: '1px solid rgba(0, 242, 254, 0.2)'
          }}
        >
          <Shield size={12} /> END-TO-END ENCRYPTED DOCUMENT ARCHIVE
        </div>
        
        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', maxWidth: '800px', fontWeight: '900' }}>
          Secure Cloud Storage Protected by <span className="gradient-text">AES-256</span>
        </h1>
        
        <p style={{ fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          SecureVault encrypts your files directly in the browser before they reach the cloud. Maintain absolute privacy with decentralised keys, self-expiring sharing links, and tamper-proof audit trails.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Enter Console <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Establish Identity
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Access Vault
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Terminal Visualizer */}
      <section className="terminal-window" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <div className="terminal-header">
          <div className="terminal-dot dot-red"></div>
          <div className="terminal-dot dot-yellow"></div>
          <div className="terminal-dot dot-green"></div>
          <div className="terminal-title">Secure Handshake Console</div>
        </div>
        <div className="terminal-body">
          <div style={{ color: 'var(--text-secondary)' }}>$ Initializing secure vault client node...</div>
          <div style={{ color: 'var(--accent-cyan)' }}>[OK] WebCrypto API detected. High-entropy CSPRNG initialized.</div>
          <div style={{ color: 'var(--accent-blue)' }}>[OK] Local database listener bound to SQLite/IndexedDB fallback.</div>
          <div>$ Generating session handshake token...</div>
          <div className="blink-cursor" style={{ color: '#10b981' }}>[SECURE] AES-GCM-256 cipher initialized. Awaiting user authorization...</div>
        </div>
      </section>

      {/* Security Features */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem' }}>Engineered Security</h2>
          <p style={{ maxWidth: '500px', margin: '8px auto 0' }}>Built from the ground up prioritizing data confidentiality, user privacy, and zero-knowledge storage.</p>
        </div>

        <div className="dashboard-grid">
          <div className="col-4 glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.1)', padding: '12px', borderRadius: '8px', width: 'max-content', color: 'var(--accent-cyan)' }}>
              <Key size={24} />
            </div>
            <h3>Zero-Knowledge Keys</h3>
            <p>Files are encrypted client-side using strong, randomly generated keys. Only you hold the key to access and decrypt your documents.</p>
          </div>

          <div className="col-4 glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(79, 172, 254, 0.1)', padding: '12px', borderRadius: '8px', width: 'max-content', color: 'var(--accent-blue)' }}>
              <EyeOff size={24} />
            </div>
            <h3>AES-256 Storage</h3>
            <p>Plaintext files never touch our servers or cloud storage. Rest easy knowing cloud leaks expose only encrypted high-entropy cyphertext.</p>
          </div>

          <div className="col-4 glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', width: 'max-content', color: '#10b981' }}>
              <Share2 size={24} />
            </div>
            <h3>Expiring Shares</h3>
            <p>Create secure share links that automatically expire. Revoke access at any time, instantly invalidating the cryptographic sharing keys.</p>
          </div>

          <div className="col-6 glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(127, 0, 255, 0.1)', padding: '16px', borderRadius: '8px', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center' }}>
              <ClipboardList size={32} />
            </div>
            <div>
              <h3 style={{ marginBottom: '6px' }}>Tamper-Proof Audit Logging</h3>
              <p>Every file action (upload, download, key retrieval, deletion) generates a signed log entry. Track access and unauthorized requests in real time.</p>
            </div>
          </div>

          <div className="col-6 glass-panel" style={{ padding: '32px', textAlign: 'left', display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '16px', borderRadius: '8px', color: 'var(--info)', display: 'flex', alignItems: 'center' }}>
              <Database size={32} />
            </div>
            <div>
              <h3 style={{ marginBottom: '6px' }}>Firebase-Powered Cloud</h3>
              <p>Backed by Firestore metadata structures and secure Firebase Storage buckets, bound strictly by access control security rules.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '30px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <p>© {new Date().getFullYear()} SecureVault Storage System. Built using zero-trust cryptography principles.</p>
      </footer>
    </div>
  );
}
