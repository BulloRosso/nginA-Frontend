// src/components/auth/MFAEnrollment.tsx
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

interface MFAEnrollmentProps {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}

const MFAEnrollment: React.FC<MFAEnrollmentProps> = ({
  open,
  onClose,
  onEnrolled
}) => {
  const { t } = useTranslation();
  const [factorId, setFactorId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeEnrollment = async () => {
      try {
        const { data, error } = await AuthService.enrollMFA();
        if (error) throw error;

        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
      } catch (err) {
        console.error('MFA enrollment error:', err);
        setError(t('auth.mfa.enrollment_error'));
      }
    };

    if (open) {
      initializeEnrollment();
    }
  }, [open]);

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);

      // First create a challenge
      const challenge = await AuthService.createMFAChallenge(factorId);
      if (challenge.error) throw challenge.error;

      // Then verify the challenge
      const verification = await AuthService.verifyMFA(
        factorId,
        challenge.data.id,
        verifyCode
      );

      if (verification.error) throw verification.error;

      onEnrolled();
      onClose();
    } catch (err) {
      setError(t('auth.mfa.verification_error'));
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

          {qrCode && (
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
          )}

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label={t('auth.mfa.enter_code')}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
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
          disabled={loading || verifyCode.length !== 6}
        >
          {loading ? <CircularProgress size={24} /> : t('auth.mfa.verify')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MFAEnrollment;