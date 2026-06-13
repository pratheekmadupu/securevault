import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please input email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setSubmitted(true);
      showToast('Decryption recovery instructions dispatched.', 'success');
    } catch (err) {
      setError(err.message || 'Verification failure.');
      showToast(err.message || 'Verification failure.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container anim-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '40px 24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ display: 'inline-flex', background: 'rgba(0, 242, 254, 0.08)', padding: '16px', borderRadius: '50%', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
          <KeyRound size={32} />
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>RECOVER NODE ACCESS</h2>
        
        {submitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div 
              style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                color: 'var(--success)', 
                padding: '16px', 
                borderRadius: '6px', 
                fontSize: '0.85rem',
                lineHeight: '1.5',
                textAlign: 'left'
              }}
            >
              🔒 Recovery dispatch complete. A reset link has been dispatched to <strong>{email}</strong>. Check your inbox to decrypt and reset your credentials.
            </div>
            
            <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', marginBottom: '24px' }}>Submit your registered email address to receive password reset tokens.</p>

            {error && (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  color: 'var(--danger)', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  fontSize: '0.85rem', 
                  textAlign: 'left',
                  marginBottom: '20px'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="email">Registered Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    style={{ paddingLeft: '42px' }}
                    placeholder="operator@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', marginBottom: '16px' }}
                disabled={loading}
              >
                {loading ? 'Dispatching recovery...' : 'Dispatch Reset Link'}
              </button>
            </form>

            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <ArrowLeft size={12} /> Return to Login
            </Link>
          </>
        )}

      </div>
    </div>
  );
}
