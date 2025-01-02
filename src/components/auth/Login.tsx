// src/components/auth/Login.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { AuthService } from '../../services/auth';
import { useAuth } from '../../contexts/auth';
import { useTranslation } from 'react-i18next';
import MFASetupModal from './MFASetupModal';
import MFAVerifyModal from './MFAVerifyModal';
import ResendConfirmation from './ResendConfirmation';
import { AuthError } from '../../types/auth';
import { MFAData } from '@/types/auth';

interface LoginProps {
  onSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const { t } = useTranslation(['common']);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaData, setMfaData] =  useState<MFAData | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login(
        formData.email,
        formData.password
      );

      console.log('Full login response:', response); // Debug log

      if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
      }

      if (response.mfa_required && response.mfa_data) {
        // Store temporary session token
        const tempToken = response.access_token; // This should come from login
        console.log('Setting up MFA with token:', tempToken); // Debug log

        setMfaData({
          factorId: response.mfa_data.factor_id,
          challengeId: response.mfa_data.challenge_id,
          qrCode: response.mfa_data.qr_code,
          secret: response.mfa_data.secret,
          needsSetup: response.mfa_data.needs_setup,
          tempToken: tempToken // Make sure this is getting set
        });
        return;
      }

      login(response.user);
      navigate('/profile-selection');
    } catch (error: AuthError | any) {
      // Detailed error logging
      console.error('Login error details:', {
          error: error,
          name: error.name,
          message: error.message,
          code: error.code
      });

      if (error.name === 'EmailNotConfirmedError' || error.code === 'email_not_confirmed') {
          setUnconfirmedEmail(formData.email);
          setError(
              <div>
                  {t('common.auth.email_not_confirmed')}
                  <Button
                      sx={{ ml: 2, marginTop: '10px', backgroundColor: '#fff',
                        border: '1px solid rgb(21,128,131)' }} 
                      onClick={() => setShowResendConfirmation(true)}
                  >
                      {t('common.auth.resend_confirmation_link')}
                  </Button>
              </div>
          );
      } else {
          const errorMessage = error.message && error.message !== 'Login failed' 
              ? error.message 
              : t('common.auth.invalid_credentials');
          setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMFAComplete = async (token: string) => {
      try {
          console.log('MFA verification completed with token:', token);

          // Update auth context with token
          localStorage.setItem('token', token);

          // Get the user data from the initial login response
          const userData = localStorage.getItem('user');
          if (!userData) {
              throw new Error('User data not found');
          }

          // Update auth context
          login(JSON.parse(userData));

          // Clear MFA data
          setMfaData(null);

          // Complete the login flow
          onSuccess();

          // Navigate to profile selection
          navigate('/profile-selection');
      } catch (error) {
          console.error('Error completing MFA flow:', error);
          setError('Failed to complete authentication');
      }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
  <React.Fragment>
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img src="/conch-logo.png" alt="Conch Logo" width="80px" />
        </Box>

        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t('common.welcomenoblivion')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            InputLabelProps={{ shrink: true }}
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('common.signin')}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              {t('common.forgotpassword')}
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>OR</Divider>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button 
                fullWidth
                variant="outlined"
                startIcon={<GoogleIcon />}
                disabled
              >
                Google
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GitHubIcon />}
                disabled
              >
                GitHub
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2">
              {t('common.auth.new_account')}
              <Link component={RouterLink} to="/register" variant="body2">
                {t('common.auth.sign_up')}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>

      {mfaData?.needsSetup ? (
        <MFASetupModal
          open={true}
          onClose={() => setMfaData(null)}
          factorId={mfaData.factorId}
          qrCode={mfaData.qrCode}
          secret={mfaData.secret}
          tempToken={mfaData.tempToken} // Should be passed here
          onSetupComplete={handleMFAComplete}
        />
      ) : mfaData && (
        <MFAVerifyModal
          open={true}
          onClose={() => setMfaData(null)}
          factorId={mfaData.factorId}
          challengeId={mfaData.challengeId!}
          tempToken={mfaData.tempToken}
          onVerified={(token) => {
              setMfaData(null);  // Clear MFA data first
              handleMFAComplete(token);  // Then complete the flow
          }}
        />
      )}
      </Container>
      <ResendConfirmation
          open={showResendConfirmation}
          email={unconfirmedEmail}
          onClose={() => setShowResendConfirmation(false)}
      />
    </React.Fragment>
  );
};