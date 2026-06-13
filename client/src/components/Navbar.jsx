import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Lock, LogOut, Terminal, User, FileText, Upload, Share2, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isMock } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Logged out securely.', 'info');
      navigate('/');
    } catch (err) {
      showToast('Logout failed: ' + err.message, 'error');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo" style={{ color: '#fff' }}>
        <Lock className="gradient-text" style={{ color: 'var(--accent-cyan)' }} />
        <span>SECURE<span className="gradient-text">VAULT</span></span>
        {isMock ? (
          <span className="badge badge-warning" style={{ fontSize: '0.6rem', marginLeft: '5px' }}>
            SIMULATED
          </span>
        ) : (
          <span className="badge badge-success" style={{ fontSize: '0.6rem', marginLeft: '5px' }}>
            LIVE
          </span>
        )}
      </Link>

      <div className="nav-links">
        {user ? (
          <>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <Terminal size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Console
            </Link>
            <Link to="/upload" className={`nav-link ${isActive('/upload') ? 'active' : ''}`}>
              <Upload size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Upload
            </Link>
            <Link to="/files" className={`nav-link ${isActive('/files') ? 'active' : ''}`}>
              <FileText size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Files
            </Link>
            <Link to="/shared" className={`nav-link ${isActive('/shared') ? 'active' : ''}`}>
              <Share2 size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Shares
            </Link>
            <Link to="/logs" className={`nav-link ${isActive('/logs') ? 'active' : ''}`}>
              <ShieldAlert size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Audits
            </Link>
            <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
              <User size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Settings
            </Link>
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <LogOut size={12} />
              Exit
            </button>
          </>
        ) : (
          <>
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Portal</Link>
            <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>Login</Link>
            <Link to="/register" className={`nav-link ${isActive('/register') ? 'active' : ''}`}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
