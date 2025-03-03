// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_validated: boolean;
  [key: string]: any;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userString = localStorage.getItem('user');

    if (userString) {
      try {
        // Parse the user JSON
        const userData = JSON.parse(userString);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
      }
    }

    setLoading(false);

    // Listen for changes to user in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const userData = JSON.parse(e.newValue);
            setUser(userData);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    user,
    loading
  };
};

export default useAuth;