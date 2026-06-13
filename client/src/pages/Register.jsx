import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShieldAlert, Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react';

export default function Register() {
  const { register, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password validation checks
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    digit: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const isPasswordValid = Object.values(checks).every(Boolean);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName || !email || !password) {
      setError('Please complete all form fields.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not satisfy cryptographic integrity checks.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(email, password, displayName);
      showToast('Registration successful! Secure Node Registered.', 'success');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container anim-slide-up" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '40px 24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px', textAlign: 'center' }}>
        
        {/* Header */}
        <div style={{ display: 'inline-flex', background: 'rgba(0, 242, 254, 0.08)', padding: '16px', borderRadius: '50%', color: 'var(--accent-cyan)', marginBottom: '16px' }}>
          <ShieldAlert size={32} />
        </div>
        
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>NODE REGISTRATION</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '24px' }}>Provision a new authorized operator profile.</p>

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
          {/* Display Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="displayName">Operator Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                id="displayName"
                type="text"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="Agent Smith"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Security Email</label>
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

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="password">Passphrase (Cipher Key)</label>
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

          {/* Password Complexity Checklist */}
          <div style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px', background: 'rgba(6, 9, 19, 0.4)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '600', color: 'var(--accent-cyan)', marginBottom: '4px', textTransform: 'uppercase' }}>Integrity Verification:</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checks.length ? <Check size={12} style={{ color: 'var(--success)' }} /> : <X size={12} style={{ color: 'var(--danger)' }} />}
              <span style={{ color: checks.length ? '#fff' : 'var(--text-muted)' }}>Min. 8 characters length</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checks.upper ? <Check size={12} style={{ color: 'var(--success)' }} /> : <X size={12} style={{ color: 'var(--danger)' }} />}
              <span style={{ color: checks.upper ? '#fff' : 'var(--text-muted)' }}>At least one uppercase letter (A-Z)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checks.lower ? <Check size={12} style={{ color: 'var(--success)' }} /> : <X size={12} style={{ color: 'var(--danger)' }} />}
              <span style={{ color: checks.lower ? '#fff' : 'var(--text-muted)' }}>At least one lowercase letter (a-z)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checks.digit ? <Check size={12} style={{ color: 'var(--success)' }} /> : <X size={12} style={{ color: 'var(--danger)' }} />}
              <span style={{ color: checks.digit ? '#fff' : 'var(--text-muted)' }}>At least one numerical digit (0-9)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {checks.special ? <Check size={12} style={{ color: 'var(--success)' }} /> : <X size={12} style={{ color: 'var(--danger)' }} />}
              <span style={{ color: checks.special ? '#fff' : 'var(--text-muted)' }}>At least one special character (@, $, !, %, *, ?, &)</span>
            </div>
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading || !isPasswordValid}
          >
            {loading ? 'Initializing Node...' : 'Register Secure Node'}
          </button>
        </form>

        {/* Login redirect */}
        <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.85rem' }}>
            Already Provisioned?{' '}
            <Link to="/login" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: '600' }}>
              Access Vault
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
