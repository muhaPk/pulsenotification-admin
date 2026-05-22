import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../store/auth.store.simple';

/**
 * Auth Guard: Redirects authenticated users away from auth pages (login, signup)
 * Use this on auth pages like login/signup to prevent authenticated users from accessing them
 */
export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
};

/**
 * Unauth Guard: Redirects unauthenticated users to login page
 * Use this on protected pages that require authentication
 */
export const useUnauthGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/signin', { replace: true });
    }
  }, [isAuthenticated, navigate]);
};
