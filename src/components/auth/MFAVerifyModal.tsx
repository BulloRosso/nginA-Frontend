// src/components/auth/MFAVerifyModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../../services/auth';

interface MFAVerifyModalProps {
  open: boolean;
  onClose: () => void;
  factorId: string;
  challengeId?: string;
  tempToken: string; 
  onVerified: (token: string) => void;
}

const MFAVerifyModal: React.FC<MFAVerifyModalProps> = ({
  open,
  onClose,
  factorId,
  challengeId,
  tempToken,
  onVerified
}) => {
  const { t } = useTranslation(['common']);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
      try {
          setLoading(true);
          setError(null);

          console.log('Starting MFA verification:', {
              factorId,
              challengeId,
              hasToken: !!tempToken,
              codeLength: code.length
          });

          const response = await AuthService.verifyMFA(
              factorId,
              code,
              challengeId,
              tempToken  // Add the tempToken here
          );

          if (response.access_token) {
              // Store the new tokens
              localStorage.setItem('token', response.access_token);
              if (response.refresh_token) {
                  localStorage.setItem('refresh_token', response.refresh_token);
              }

              onVerified(response.access_token);
              onClose();
          } else {
              throw new Error('No access token in response');
          }
      } catch (err: any) {
          console.error('MFA verification error:', err);
          setError(t('common.auth.mfa.invalid_code'));
      } finally {
          setLoading(false);
      }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('common.auth.mfa.verification_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignContent: 'center' }}>
          <img src="/img/auth-icons.jpg" style={{ alignSelf: 'center', maxWidth: '140px'}} alt="MFA verification" />
          </Box>
          <Typography>
            {t('common.auth.mfa.enter_code_prompt')}
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('common.auth.mfa.enter_code')}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            inputProps={{ maxLength: 6 }}
            autoComplete="one-time-code"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || code.length !== 6}
        >
          {loading ? <CircularProgress size={24} /> : t('common.auth.mfa.verify')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MFAVerifyModal;