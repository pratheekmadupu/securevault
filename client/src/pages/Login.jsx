import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
      showToast('Authentication successful. Session established.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Verify credentials.');
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container anim-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '40px 24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', textAlign: 'center' }}>
        
        {/* Title */}
        <div style={{ display: 'inline-flex', background: 'rgba(0, 242, 254, 0.08)', padding: '16px', borderRadius: '50%', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
          <Shield size={32} />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>IDENTITY VERIFICATION</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '24px' }}>Enter credentials to access secure node.</p>

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
          {/* Email input */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Node ID / Email</label>
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

          {/* Password input */}
          <div className="form-group" style={{ marginBottom: '10px' }}>
            <label className="form-label" htmlFor="password">Passphrase</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', 
                  right: '14px', 
                  top: '15px', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--text-muted)', 
                  cursor: 'pointer' 
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'right', marginBottom: '24px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'none' }}>
              Recover authorization key?
            </Link>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? 'Authorizing Session...' : 'Establish Session'}
          </button>
        </form>

        {/* Register redirection */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem' }}>
            Unregistered Operator?{' '}
            <Link to="/register" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: '600' }}>
              Register Node
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
