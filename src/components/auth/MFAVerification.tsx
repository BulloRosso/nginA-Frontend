// src/components/auth/MFAVerification.tsx
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

interface MFAVerificationProps {
  open: boolean;
  factorId: string;
  onClose: () => void;
  onVerified: () => void;
}

const MFAVerification: React.FC<MFAVerificationProps> = ({
  open,
  factorId,
  onClose,
  onVerified
}) => {
  const { t } = useTranslation(['common']);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      onVerified();
      onClose();
    } catch (err) {
      setError(t('common.auth.mfa.verification_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('common.auth.mfa.verification_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
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
          {loading ? <CircularProgress size={24} /> : t('common.auth.mfa.verify')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MFAVerification;