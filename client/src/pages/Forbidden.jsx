import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Forbidden() {
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', padding: '40px 24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
        
        <div style={{ display: 'inline-flex', background: 'rgba(239, 68, 68, 0.08)', padding: '20px', borderRadius: '50%', color: 'var(--danger)', marginBottom: '24px' }}>
          <ShieldAlert size={48} />
        </div>

        <h1 style={{ fontSize: '3rem', margin: '0 0 10px', color: 'var(--danger)', fontFamily: 'var(--font-cyber)' }}>403</h1>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>ACCESS UNAUTHORIZED</h2>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>
          Your session does not hold the cryptographic clearance keys required to access this node. This intrusion attempt has been logged in the audit ledgers.
        </p>

        <Link to="/" className="btn btn-primary" style={{ width: '100%', gap: '8px' }}>
          <ArrowLeft size={16} /> Return to Portal
        </Link>

      </div>
    </div>
  );
}
