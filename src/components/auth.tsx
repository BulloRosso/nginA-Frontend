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
  Grid,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthService, SignupData } from '../services/auth';
import { useAuth } from '../contexts/auth';
import { useTranslation } from 'react-i18next';

// Register Component
export const Register = ({ onSuccess }) => {
  const { t } = useTranslation(['common']);  // Add namespace
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    enableMFA: true,
  });
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMFAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      enableMFA: e.target.checked
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit formData:', formData); // Add this line
    if (formData.password !== formData.confirmPassword) {
      setError(t('common.auth.passwords_dont_match'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        enableMFA: formData.enableMFA
      });

      login(response.user);
      onSuccess?.();
      navigate('/profile-selection');
    } catch (error: any) {
      setError(error.response?.data?.detail || t('common.auth.signup_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <img src="/public/conch-logo.png" alt={t('common.logo_alt')} width="80px" />
        </Box>

        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t('common.auth.create_account')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('common.auth.first_name')}
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t('common.auth.last_name')}
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label={t('common.auth.email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            label={t('common.auth.password')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleInputChange}
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
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

          <TextField
            fullWidth
            label={t('common.auth.confirm_password')}
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleInputChange}
            margin="normal"
            required
          />

          <Box sx={{ mt: 2 }}>
            <Tooltip title={t('common.auth.mfa.tooltip')}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableMFA}
                    onChange={(e) => handleMFAChange(e)}
                    name="enableMFA"
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon color={formData.enableMFA ? "primary" : "action"} />
                    {t('common.auth.enable_mfa')}
                  </Box>
                }
              />
            </Tooltip>
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('common.auth.create_account')}
          </Button>

          <Divider sx={{ my: 3 }}>{t('common.auth.or')}</Divider>

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
              {t('common.auth.already_have_account')}{' '}
              <Link href="/login" variant="body2">
                {t('common.auth.sign_in')}
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

// ForgotPassword Component
export const ForgotPassword = ({ onSuccess }) => {
  const { t } = useTranslation(['common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await AuthService.requestPasswordReset(email);
      setSuccess(true);
      // We still show success even if email doesn't exist (security best practice)
      onSuccess?.();
    } catch (error) {
      // We don't show specific errors to prevent email enumeration
      setError(t('auth.password_reset_error'));
      console.error('Password reset request error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          {t('common.auth.reset_password')}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t('common.auth.password_reset_instructions_sent')}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : t('common.auth.send_reset_instructions')}
          </Button>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/login" variant="body2">
              {t('common.auth.back_to_login')}
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};