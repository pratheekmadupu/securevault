import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FileProvider } from './contexts/FileContext';
import { ToastProvider } from './contexts/ToastContext';

// Components & Pages
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import FileManagement from './pages/FileManagement';
import SharedFiles from './pages/SharedFiles';
import SharedView from './pages/SharedView';
import Profile from './pages/Profile';
import ActivityLogs from './pages/ActivityLogs';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';

import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 70px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 20px' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '20px', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <FileProvider>
            
            {/* Global Navbar */}
            <Navbar />

            {/* Layout Viewport */}
            <main style={{ flex: 1, position: 'relative' }}>
              <div className="radial-glow-secondary"></div>
              
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/shared-view/:shareId" element={<SharedView />} />

                {/* Protected Operator Console Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/upload" element={
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                } />
                <Route path="/files" element={
                  <ProtectedRoute>
                    <FileManagement />
                  </ProtectedRoute>
                } />
                <Route path="/shared" element={
                  <ProtectedRoute>
                    <SharedFiles />
                  </ProtectedRoute>
                } />
                <Route path="/logs" element={
                  <ProtectedRoute>
                    <ActivityLogs />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Errors */}
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

          </FileProvider>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
