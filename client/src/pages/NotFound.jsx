import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)', padding: '40px 24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '40px 32px', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', background: 'rgba(79, 172, 254, 0.08)', padding: '20px', borderRadius: '50%', color: 'var(--accent-blue)', marginBottom: '24px' }}>
          <HelpCircle size={48} />
        </div>

        <h1 style={{ fontSize: '3rem', margin: '0 0 10px', color: 'var(--accent-blue)', fontFamily: 'var(--font-cyber)' }}>404</h1>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>RESOURCE NOT FOUND</h2>
        
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '28px', lineHeight: '1.6' }}>
          The requested address does not map to any active node in the SecureVault domain. Verify the access URL path and try again.
        </p>

        <Link to="/" className="btn btn-primary" style={{ width: '100%', gap: '8px' }}>
          <ArrowLeft size={16} /> Return to Portal
        </Link>

      </div>
    </div>
  );
}
