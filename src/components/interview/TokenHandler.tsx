// src/components/interview/TokenHandler.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Button, 
  Alert 
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { InvitationService } from '../../services/invitations';
import { LoadingState } from '../common/LoadingState';
import { ErrorState } from '../common/ErrorState';

const TokenHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation(['invitation','common']);
  const token = searchParams.get('token');

  // Move validateToken inside the component to ensure it has access to state and hooks
  const validateToken = async () => {
    if (!token) {
      setError('No token provided');
      setIsValidating(false);
      return;
    }

    try {
      // Validate the token
      const validationResult = await InvitationService.validateToken(token);

      if (validationResult.valid) {
        // Store token in sessionStorage for the interview duration
        sessionStorage.setItem('interview_token', token);
        sessionStorage.setItem('profile_id', validationResult.profile_id);

        // Redirect to interview page without token in URL
        navigate('/interview', { replace: true });
      } else {
        setError(validationResult.error || 'Invalid or expired token');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate invitation token');
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    validateToken();
  }, [token, navigate]);

  if (isValidating) {
    return (
      <LoadingState 
        fullScreen 
        message={t('invitation.validating')} 
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        error={t(`invitation.errors.${error}`)}
        fullScreen
        title={t('invitation.access_error')}
        onRetry={() => {
          if (token) {
            setIsValidating(true);
            setError(null);
            // Re-run validation
            validateToken();
          } else {
            navigate('/');
          }
        }}
      />
    );
  }

  return null; // Will redirect if token is valid
};

export default TokenHandler;