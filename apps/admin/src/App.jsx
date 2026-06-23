import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@shared/context/AuthContext.jsx';
import { ThemeProvider } from '@shared/context/ThemeContext.jsx';
import { ProtectedRoute } from '@shared/components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Admin from './pages/Admin.jsx';

import Unauthorized from '@shared/components/Unauthorized.jsx';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/admin" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/admin" /> : <Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected — ADMIN only */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole={['ADMIN', 'SUPER_ADMIN']}>
          <Admin />
        </ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/admin' : '/login'} />} />
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
