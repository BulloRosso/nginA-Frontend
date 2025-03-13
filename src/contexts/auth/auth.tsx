// src/contexts/auth.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_validated?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isTokenValidated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTokenValidated, setIsTokenValidated] = useState(false);

  // Function to validate token by making an API request
  const validateToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      return false;
    }

    try {
      // Parse the user data to get the ID
      const userData = JSON.parse(userStr);

      // Make a lightweight API call to validate the token
      const response = await api.get(`/api/v1/auth/validation-status/${userData.id}`);
      return response.data.is_validated === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUser(userData);

            // Validate the token on initialization
            const isValid = await validateToken();
            setIsTokenValidated(isValid);
            setIsAuthenticated(isValid);

            if (!isValid) {
              // If token is invalid, try refresh once
              try {
                await api.post('/api/v1/auth/refresh');
                const refreshValid = await validateToken();
                setIsTokenValidated(refreshValid);
                setIsAuthenticated(refreshValid);

                if (!refreshValid) {
                  // If refresh fails, clear auth data
                  logout();
                }
              } catch (refreshError) {
                console.error('Token refresh failed during initialization:', refreshError);
                logout();
              }
            }
          } catch (parseError) {
            console.error('Error parsing user data:', parseError);
            // Clear potentially corrupted data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            setIsTokenValidated(false);
          }
        } else {
          // Token exists but no user data
          setUser(null);
          setIsAuthenticated(false);
          setIsTokenValidated(false);
        }
      } else {
        // No token
        setUser(null);
        setIsAuthenticated(false);
        setIsTokenValidated(false);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      setIsTokenValidated(false);
    } finally {
      setIsLoading(false);
    }
  }, [validateToken]);

  useEffect(() => {
    initializeAuth();

    // Add storage event listener for cross-tab sync
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          // Token removed
          setUser(null);
          setIsAuthenticated(false);
          setIsTokenValidated(false);
        } else {
          // Token added/changed - recheck user data
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const userData = JSON.parse(userStr);
              setUser(userData);
              setIsAuthenticated(true);
              validateToken().then(isValid => {
                setIsTokenValidated(isValid);
                setIsAuthenticated(isValid);
              });
            } catch (error) {
              console.error('Error parsing user data:', error);
              setUser(null);
              setIsAuthenticated(false);
              setIsTokenValidated(false);
            }
          }
        }
      }
    };

    // Add event listener for token expiration from API interceptor
    const handleTokenExpired = () => {
      console.log('Token expired event received');
      logout();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, [initializeAuth, validateToken]);

  const login = (userData: User) => {
    console.log('Login called with:', userData);
    setUser(userData);
    setIsAuthenticated(true);
    setIsTokenValidated(true);
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    console.log('Logout called');
    setUser(null);
    setIsAuthenticated(false);
    setIsTokenValidated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('profileId');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    isTokenValidated,
    login,
    logout,
    validateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};