// src/components/auth/AuthGuard.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isTokenValidated, validateToken, isLoading } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkToken = async () => {
      if (isTokenValidated) {
        // Token is already validated in the auth context
        setIsValid(isAuthenticated);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);
      try {
        const valid = await validateToken();
        setIsValid(valid);
      } catch (error) {
        console.error('Token validation error:', error);
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (!isLoading) {
      checkToken();
    }
  }, [isLoading, validateToken, isAuthenticated, isTokenValidated]);

  // Show loading spinner while auth is initializing or validating
  if (isLoading || isValidating) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
        gap={2}
      >
        <CircularProgress />
        <Typography variant="body1">Verifying authentication...</Typography>
      </Box>
    );
  }

  // If not authenticated or token is invalid, redirect to login
  if (!isValid) {
    // Save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If authenticated and token is valid, render the children
  return <>{children}</>;
};

export default AuthGuard;