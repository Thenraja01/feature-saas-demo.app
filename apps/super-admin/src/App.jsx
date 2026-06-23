import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@shared/context/AuthContext.jsx';
import { ThemeProvider } from '@shared/context/ThemeContext.jsx';
import { ProtectedRoute } from '@shared/components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';

import Unauthorized from '@shared/components/Unauthorized.jsx';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/super-admin" /> : <Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected — SUPER_ADMIN only */}
      <Route path="/super-admin" element={
        <ProtectedRoute requiredRole="SUPER_ADMIN">
          <SuperAdmin />
        </ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/super-admin' : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
