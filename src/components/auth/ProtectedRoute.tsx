import React from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../../store/auth.store.simple';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Wraps routes that require authentication
 * Redirects to /signin if user is not authenticated
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

/**
 * Auth Route Component
 * Wraps auth pages (login, signup) that should redirect if user is already authenticated
 * Redirects to / (dashboard) if user is authenticated
 */
export const AuthRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
