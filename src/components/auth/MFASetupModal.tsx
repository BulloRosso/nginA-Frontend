// src/components/auth/MFASetupModal.tsx
import React, { useState, useEffect } from 'react';
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

interface MFASetupModalProps {
  open: boolean;
  onClose: () => void;
  factorId: string;
  qrCode?: string;
  secret?: string;
  tempToken?: string; 
  onSetupComplete: (token: string) => void;
}

const MFASetupModal: React.FC<MFASetupModalProps> = ({
  open,
  onClose,
  factorId,
  qrCode,
  secret,
  tempToken, 
  onSetupComplete
}) => {
  const { t } = useTranslation(['common']);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Debug log when props change
    console.log('MFA Setup Modal Props:', {
      factorId,
      qrCode: !!qrCode,
      secret: !!secret,
      tempToken
    });
  }, [factorId, qrCode, secret, tempToken]);
  
  if (!qrCode || !secret) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>{t('common.auth.mfa.setup_error_title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
            <Typography color="error">
              {t('common.auth.mfa.setup_error_message')}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Starting MFA verification with:', {
        factorId,
        code,
        tempToken
      });

      const response = await AuthService.verifyMFA(
        factorId,
        code,
        null,  // No challenge ID for initial setup
        tempToken
      );

      console.log('MFA verification successful:', response);

      if (response.access_token) {
        onSetupComplete(response.access_token);
        onClose();
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('MFA verification error:', err);
      setError(t('common.auth.mfa.verification_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('common.auth.mfa.setup_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          <Typography>
            {t('common.auth.mfa.scan_qr_prompt')}
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            backgroundColor: '#f5f5f5',
            p: 2, 
            borderRadius: 1
          }}>
            <img 
              src={`data:image/svg+xml;base64,${btoa(qrCode)}`}
              alt="MFA QR Code"
              style={{ maxWidth: 200 }} 
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {t('common.auth.mfa.manual_entry')}: {secret}
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

export default MFASetupModal;