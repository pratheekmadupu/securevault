import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword as firebaseUpdatePassword,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  // Check if we are running in real Firebase or Mock mode
  const isMock = !isFirebaseConfigured;

  // Sync user with backend
  const syncWithBackend = async (uid, email, displayName, token) => {
    try {
      localStorage.setItem('sv_token', token);
      await api.auth.syncUser({ uid, email, displayName });
      // Fetch activity logs
      const userLogs = await api.auth.getLogs();
      setLogs(userLogs);
    } catch (err) {
      console.error('Error syncing authentication with backend:', err);
    }
  };

  useEffect(() => {
    if (!isMock && auth) {
      // Real Firebase listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              token
            };
            setUser(userData);
            await syncWithBackend(userData.uid, userData.email, userData.displayName, token);
          } catch (err) {
            console.error('Token fetch failed:', err);
            setUser(null);
            localStorage.removeItem('sv_token');
          }
        } else {
          setUser(null);
          localStorage.removeItem('sv_token');
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      // Mock Auth initialization
      const mockSession = localStorage.getItem('sv_mock_session');
      if (mockSession) {
        try {
          const parsed = JSON.parse(mockSession);
          setUser(parsed);
          localStorage.setItem('sv_token', parsed.token);
          // Sync with mock backend
          syncWithBackend(parsed.uid, parsed.email, parsed.displayName, parsed.token);
        } catch (err) {
          console.error('Failed to parse mock session', err);
          localStorage.removeItem('sv_mock_session');
          localStorage.removeItem('sv_token');
        }
      }
      setLoading(false);
    }
  }, [isMock]);

  // Refresh logs
  const refreshLogs = async () => {
    try {
      const userLogs = await api.auth.getLogs();
      setLogs(userLogs);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  // Register
  const register = async (email, password, displayName) => {
    setLoading(true);
    try {
      // Validate Password Complexity
      const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!pwdRegex.test(password)) {
        throw new Error('Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.');
      }

      if (!isMock && auth) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        const token = await userCredential.user.getIdToken();
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: displayName,
          token
        };
        setUser(userData);
        await syncWithBackend(userData.uid, userData.email, userData.displayName, token);
        return userData;
      } else {
        // Mock Register
        const mockUsers = JSON.parse(localStorage.getItem('sv_mock_users') || '[]');
        if (mockUsers.some(u => u.email === email)) {
          throw new Error('Email is already registered.');
        }

        const newUser = {
          uid: 'mock_uid_' + Math.random().toString(36).substring(2, 9),
          email,
          password, // stored in mock db (in memory/localstorage) for simulation
          displayName
        };
        mockUsers.push(newUser);
        localStorage.setItem('sv_mock_users', JSON.stringify(mockUsers));

        const token = `mock-token-${newUser.uid}`;
        const sessionUser = {
          uid: newUser.uid,
          email: newUser.email,
          displayName: newUser.displayName,
          token
        };
        
        localStorage.setItem('sv_mock_session', JSON.stringify(sessionUser));
        localStorage.setItem('sv_token', token);
        setUser(sessionUser);
        await syncWithBackend(sessionUser.uid, sessionUser.email, sessionUser.displayName, token);
        return sessionUser;
      }
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      if (!isMock && auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const token = await userCredential.user.getIdToken();
        const userData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || userCredential.user.email.split('@')[0],
          token
        };
        setUser(userData);
        await syncWithBackend(userData.uid, userData.email, userData.displayName, token);
        return userData;
      } else {
        // Mock Login
        const mockUsers = JSON.parse(localStorage.getItem('sv_mock_users') || '[]');
        const foundUser = mockUsers.find(u => u.email === email && u.password === password);
        
        if (!foundUser) {
          throw new Error('Invalid email or password.');
        }

        const token = `mock-token-${foundUser.uid}`;
        const sessionUser = {
          uid: foundUser.uid,
          email: foundUser.email,
          displayName: foundUser.displayName,
          token
        };

        localStorage.setItem('sv_mock_session', JSON.stringify(sessionUser));
        localStorage.setItem('sv_token', token);
        setUser(sessionUser);
        await syncWithBackend(sessionUser.uid, sessionUser.email, sessionUser.displayName, token);
        return sessionUser;
      }
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    setLoading(true);
    try {
      if (!isMock && auth) {
        await signOut(auth);
      } else {
        localStorage.removeItem('sv_mock_session');
      }
      localStorage.removeItem('sv_token');
      setUser(null);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email) => {
    if (!isMock && auth) {
      await sendPasswordResetEmail(auth, email);
    } else {
      // Mock Reset Password
      const mockUsers = JSON.parse(localStorage.getItem('sv_mock_users') || '[]');
      if (!mockUsers.some(u => u.email === email)) {
        throw new Error('No account found with this email address.');
      }
      // Simulate sending email
      console.log(`🔒 Mock: Reset password email sent to ${email}`);
    }
  };

  // Update Profile & Settings
  const updateProfileDetails = async (displayName, newPassword) => {
    setLoading(true);
    try {
      if (!isMock && auth && auth.currentUser) {
        const fbUser = auth.currentUser;
        if (displayName) {
          await updateProfile(fbUser, { displayName });
          setUser(prev => ({ ...prev, displayName }));
        }
        if (newPassword) {
          const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          if (!pwdRegex.test(newPassword)) {
            throw new Error('Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a digit, and a special character.');
          }
          await firebaseUpdatePassword(fbUser, newPassword);
        }
        await syncWithBackend(fbUser.uid, fbUser.email, displayName || fbUser.displayName, localStorage.getItem('sv_token'));
      } else if (isMock && user) {
        const mockUsers = JSON.parse(localStorage.getItem('sv_mock_users') || '[]');
        const updatedUsers = mockUsers.map(u => {
          if (u.uid === user.uid) {
            return {
              ...u,
              displayName: displayName || u.displayName,
              password: newPassword || u.password
            };
          }
          return u;
        });
        localStorage.setItem('sv_mock_users', JSON.stringify(updatedUsers));
        
        const updatedSession = {
          ...user,
          displayName: displayName || user.displayName
        };
        localStorage.setItem('sv_mock_session', JSON.stringify(updatedSession));
        setUser(updatedSession);
        await syncWithBackend(updatedSession.uid, updatedSession.email, updatedSession.displayName, updatedSession.token);
      }
      await refreshLogs();
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    logs,
    register,
    login,
    logout,
    resetPassword,
    updateProfileDetails,
    refreshLogs,
    isMock
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
