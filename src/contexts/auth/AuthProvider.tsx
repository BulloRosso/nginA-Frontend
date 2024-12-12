// src/contexts/auth/AuthProvider.tsx
import { ReactNode, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { User } from './types';
import { AuthService } from '../../services/auth';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    AuthService.logout();
    window.location.href = '/login';
  };

  const isAuthenticated = Boolean(user && localStorage.getItem('token'));

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      window.location.href = '/login';
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};