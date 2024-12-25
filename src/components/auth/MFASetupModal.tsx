// src/components/auth/MFASetupModal.tsx
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

interface MFASetupModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  accessToken: string;
  mfaData: {
    qr_code: string;
    secret: string;
  };
  onSetupComplete: () => void;
}

const MFASetupModal: React.FC<MFASetupModalProps> = ({
  open,
  onClose,
  userId,
  mfaData,
  onSetupComplete
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError(null);

      await AuthService.verifyMFA(userId, code, accessToken);
      onSetupComplete();
      onClose();
    } catch (err) {
      setError(t('auth.mfa.invalid_code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('common.auth.mfa.setup_title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          <Typography>{t('common.auth.mfa.setup_instructions')}</Typography>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            backgroundColor: '#f5f5f5',
            p: 2, 
            borderRadius: 1
          }}>
            <img 
              src={mfaData.qr_code} 
              alt="MFA QR Code"
              style={{ maxWidth: 200 }} 
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            {t('common.auth.mfa.manual_entry')}: {mfaData.secret}
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