// src/hoc/withTokenProtection.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { InvitationService } from '../services/invitations';
import { useAuth } from '../contexts/auth';
import { AppLayout } from '../components/layout/AppLayout';  

interface TokenValidationState {
  isValid: boolean;
  isLoading: boolean;
  profileId: string | null;
}

export const withTokenProtection = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return function WithTokenProtection(props: P) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [validationState, setValidationState] = useState<TokenValidationState>({
      isValid: false,
      isLoading: true,
      profileId: null
    });

    useEffect(() => {
      const validateAccess = async () => {
        // If user is authenticated, allow access
        if (isAuthenticated) {
          const profileId = localStorage.getItem('profileId');
          setValidationState({
            isValid: true,
            isLoading: false,
            profileId: profileId
          });
          return;
        }

        // Check for interview token
        const token = sessionStorage.getItem('interview_token');
        const storedProfileId = sessionStorage.getItem('profile_id');

        if (!token || !storedProfileId) {
          setValidationState({
            isValid: false,
            isLoading: false,
            profileId: null
          });
          return;
        }

        try {
          // Validate the token
          const validationResult = await InvitationService.validateToken(token);

          if (!validationResult.valid) {
            // Clear invalid tokens
            sessionStorage.removeItem('interview_token');
            sessionStorage.removeItem('profile_id');
            setValidationState({
              isValid: false,
              isLoading: false,
              profileId: null
            });
            return;
          }

          // Token is valid
          setValidationState({
            isValid: true,
            isLoading: false,
            profileId: storedProfileId
          });

          navigate('/interview-welcome');
          
        } catch (error) {
          console.error('Token validation error:', error);
          setValidationState({
            isValid: false,
            isLoading: false,
            profileId: null
          });
        }
      };

      validateAccess();
    }, [isAuthenticated]);

    if (validationState.isLoading) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {t('common.validating_access')}
          </Typography>
        </Box>
      );
    }

    if (!validationState.isValid) {
      return <Navigate to="/login" replace />;
    }

    // Pass the profileId as a prop to the wrapped component
    return <WrappedComponent {...props} profileId={validationState.profileId} />;
  };
};

// Create a type-safe HOC wrapper
export type WithTokenProtectionProps = {
  profileId: string;
};

// Create a protected route component
export const TokenProtectedRoute: React.FC<{
  children: React.ReactElement;
}> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const ProtectedComponent = withTokenProtection(() => {
    // If using regular authentication, wrap with AppLayout
    if (isAuthenticated) {
      return <AppLayout>{children}</AppLayout>;
    }
    // If using interview token, render without AppLayout
    return children;
  });

  return <ProtectedComponent />;
};

// Usage example:
/*
const InterviewPage = withTokenProtection((props: Props & WithTokenProtectionProps) => {
  // Use props.profileId to access the profile
  return <div>Protected Interview Page</div>;
});
*/