import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User, Key, ShieldCheck, Database, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Profile() {
  const { user, updateProfileDetails, isMock, logout } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!displayName) {
      showToast('DisplayName cannot be empty.', 'error');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('Passphrases do not match.', 'error');
      return;
    }

    setLoading(true);
    try {
      await updateProfileDetails(displayName, newPassword || null);
      showToast('Profile credentials updated successfully.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const purgeSimulationLedger = () => {
    if (!window.confirm('🚨 WARNING: You are about to purge ALL local simulated users, files, and logs. You will be logged out and the application will reset. Proceed?')) return;
    
    localStorage.clear();
    showToast('Simulation ledgers purged. Resetting database.', 'info');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="container anim-fade" style={{ padding: '30px 24px' }}>
      
      {/* Title */}
      <header style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
          SECURITY <span className="gradient-text">SETTINGS</span>
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Manage your operator identity and review cryptographic specifications.
        </p>
      </header>

      {/* Main Grid */}
      <div className="profile-grid">
        
        {/* Left Side: Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(0, 242, 254, 0.08)', padding: '20px', borderRadius: '50%', color: 'var(--accent-cyan)', width: 'max-content' }}>
              <User size={48} />
            </div>
            
            <h3 style={{ fontSize: '1.1rem', color: '#fff' }}>{user?.displayName}</h3>
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>ACTIVE OPERATOR</span>
            
            <div style={{ borderTop: '1px solid var(--border-color)', width: '100%', paddingTop: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <div>Node ID: <code style={{ fontSize: '0.75rem', padding: '2px 4px' }}>{user?.uid.substring(0, 12)}...</code></div>
              <div>Security Mail: <strong>{user?.email}</strong></div>
              <div>MFA: <strong style={{ color: '#10b981' }}>ENFORCED (SMS/E2E)</strong></div>
            </div>
          </div>

          {/* Developer Mock Tool */}
          {isMock && (
            <div className="glass-panel" style={{ padding: '24px', border: '1px dashed var(--danger)' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <AlertTriangle size={16} />
                SIMULATION COMMANDS
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                Running in client local simulation. Purge local databases to delete simulated users, files, and reset ledger state.
              </p>
              <button 
                onClick={purgeSimulationLedger} 
                className="btn btn-danger" 
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.75rem', gap: '6px' }}
              >
                <RefreshCw size={12} />
                Purge Local Ledgers
              </button>
            </div>
          )}

        </div>

        {/* Right Side: Credentials & Crytographic briefing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Form */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <Key size={18} style={{ color: 'var(--accent-cyan)' }} />
              CREDENTIAL MAINTENANCE
            </h3>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group">
                <label className="form-label" htmlFor="displayName">Operator Handle</label>
                <input
                  id="displayName"
                  type="text"
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Passphrase</label>
                  <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="Leave empty to keep current"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm Passphrase</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="Leave empty to keep current"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: 'max-content', padding: '10px 24px', alignSelf: 'flex-end', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'Updating Credentials...' : 'Save Settings'}
              </button>

            </form>
          </div>

          {/* Cryptographic Briefing */}
          <div className="glass-panel" style={{ padding: '32px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              SECURITY POLICIES & ENCRYPTION RULES
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              
              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>🛡️ Zero-Knowledge Architecture</strong>
                All files are encrypted in the local browser context using random 256-bit symmetric keys prior to network upload. The raw contents never traverse the network in plaintext.
              </div>

              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>🔑 Cryptographic Cipher Selection</strong>
                SecureVault uses the Advanced Encryption Standard (AES) in Cipher Block Chaining (CBC) mode with a 256-bit key length, backed by the PBKDF2 key derivation standard.
              </div>

              <div>
                <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>👁️ Direct Object Reference Prevention</strong>
                Our APIs inspect every file request against Firebase Firestore security assertions, verifying token signatures and checking ownership rules before return.
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
