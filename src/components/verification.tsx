import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth';
import { Navigate, useLocation } from 'react-router-dom';
import api  from '../services/api'
import { AuthService } from '../services/auth';

// In your verification components file
interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
}

export const VerificationCheck: React.FC = () => {
  const { user } = useAuth();
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    // Only show verification dialog if:
    // 1. User exists
    // 2. User is not validated
    // 3. User hasn't dismissed the dialog in this session
    const hasUserDismissedVerification = sessionStorage.getItem('verification_dismissed');

    if (user && 
        user.is_validated === false && 
        !hasUserDismissedVerification) {
      setShowVerification(true);
    }
  }, [user, user?.is_validated]);

  const handleClose = () => {
    setShowVerification(false);
    // Mark verification as dismissed for this session
    sessionStorage.setItem('verification_dismissed', 'true');
  };

  return (
    <VerificationDialog 
      open={showVerification}
      onClose={handleClose}
    />
  );
};

export const VerifiedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isValidated, setIsValidated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkValidation = async () => {
      if (user?.id) {
        try {
          const validationStatus = await AuthService.checkValidationStatus(user.id);
          setIsValidated(validationStatus);
        } catch (error) {
          console.error('Validation check failed:', error);
          setIsValidated(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkValidation();
  }, [user?.id]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isValidated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Email Verification Required
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Please verify your email address to access this page.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return <>{children}</>;
};

export const VerificationDialog: React.FC<VerificationDialogProps> = ({ open, onClose }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirm, setShowResendConfirm] = useState(false);

  const handleResend = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verificationApi.resendVerification(user.id);
      if (result.success) {
        setShowResendConfirm(true);
        // Hide success message after 5 seconds
        setTimeout(() => {
          setShowResendConfirm(false);
        }, 5000);
      } else {
        setError('Failed to resend verification code.');
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      setError(error.response?.data?.detail || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  
  const handleVerification = async () => {
    if (!user?.id || !verificationCode) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verificationApi.verifyEmail(verificationCode, user.id);

      if (result.verified) {
        // First update user state
        login({
          ...user,
          is_validated: true
        });

        // Close the dialog immediately
        onClose();

        // Navigate after a short delay
        setTimeout(() => {
          navigate('/profile-selection');
        }, 100);
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.response?.data?.detail || 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update your verification code input to handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 8) {
      handleVerification();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Verify Your Email
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="body1" gutterBottom>
            Please enter the 8-digit verification code sent to {user?.email}.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {showResendConfirm && (
            <Alert severity="success" sx={{ mb: 2 }}>
              A new verification code has been sent to your email.
            </Alert>
          )}

          <TextField
            fullWidth
            label="Verification Code"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value.length <= 8) {
                setVerificationCode(value);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter 8-digit code"
            sx={{ mb: 2 }}
            inputProps={{
              maxLength: 8,
              pattern: '[0-9]*'
            }}
            error={!!error}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handleResend}
              disabled={loading}
            >
              Resend Code
            </Button>

            <Button
              variant="contained"
              onClick={handleVerification}
              disabled={loading || verificationCode.length !== 8}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Also update the verificationApi object to properly log responses:
const verificationApi = {
  async verifyEmail(code: string, userId: string): Promise<{ verified: boolean }> {
    try {
      const response = await api.post('/api/v1/auth/verify-email', {
        code: code,  // Changed to match backend's expected format
        user_id: userId
      });
      console.log('Verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Verification API error:', error);
      throw error;
    }
  },

  async resendVerification(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.post('/api/v1/auth/resend-verification', {
        user_id: userId
      });
      console.log('Resend response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Resend API error:', error); // Debug log
      throw error;
    }
  }
};