import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@shared/context/AuthContext.jsx';
import { ThemeProvider } from '@shared/context/ThemeContext.jsx';
import { ProtectedRoute } from '@shared/components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import User from './pages/User.jsx';

import Unauthorized from '@shared/components/Unauthorized.jsx';

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/user" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/user" /> : <Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected — USER role */}
      <Route path="/user" element={
        <ProtectedRoute requiredRole={['USER', 'ADMIN', 'SUPER_ADMIN']}>
          <User />
        </ProtectedRoute>
      } />

      {/* Default */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/user' : '/login'} />} />
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
