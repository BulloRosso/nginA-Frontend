// src/components/auth/RoleAuthGuard.tsx
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts/auth';
import { getUserRoleFromToken } from '../../utils/jwtDecode';

interface RoleAuthGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectPath?: string;
}

const RoleAuthGuard: React.FC<RoleAuthGuardProps> = ({ 
  children, 
  allowedRoles, 
  redirectPath = '/login' 
}) => {
  const { isAuthenticated, isLoading, validateToken } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkTokenAndRole = async () => {
      setIsValidating(true);
      try {
        // First validate the token
        const tokenValid = await validateToken();

        if (!tokenValid) {
          setHasRequiredRole(false);
          setIsValidating(false);
          return;
        }

        // Get the token and extract role
        const token = localStorage.getItem('token');
        if (!token) {
          setHasRequiredRole(false);
          setIsValidating(false);
          return;
        }

        const userRole = getUserRoleFromToken(token);
        console.log('User role:', userRole, 'Allowed roles:', allowedRoles);

        // Check if user's role is in the allowed roles list
        const roleAuthorized = userRole && allowedRoles.includes(userRole);
        setHasRequiredRole(roleAuthorized);
      } catch (error) {
        console.error('Role validation error:', error);
        setHasRequiredRole(false);
      } finally {
        setIsValidating(false);
      }
    };

    if (!isLoading) {
      checkTokenAndRole();
    }
  }, [isLoading, validateToken]);

  // Show loading spinner while checking
  if (isLoading || isValidating) {
    return (
     <div></div>
    );
  }

  // If not authenticated or missing required role, redirect
  if (!hasRequiredRole) {
    return <Navigate to={redirectPath} state={{ from: location.pathname }} replace />;
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
};

export default RoleAuthGuard;