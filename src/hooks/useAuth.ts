import { useState } from 'react';
import apiClient from './apiClient';
import { AUTH_CONFIG } from '../config/config';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginRequest): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/login', credentials);
      const data: LoginResponse = response.data;

      // Store tokens and user data
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.user));

      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<LoginResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/register', userData);
      const data: LoginResponse = response.data;

      // Store tokens and user data
      localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, data.access_token);
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, data.refresh_token);
      localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(data.user));

      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    window.location.href = '/signin';
  };

  const getCurrentUser = () => {
    const userData = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
  };

  return {
    login,
    register,
    logout,
    getCurrentUser,
    isAuthenticated,
    loading,
    error,
  };
};
