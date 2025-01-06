// src/components/modals/InvitationDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { InvitationService } from '../../services/invitations';
import { Profile } from '../../types/profile';

interface InvitationDialogProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  onSuccess: () => void;
}

const InvitationDialog: React.FC<InvitationDialogProps> = ({
  open,
  onClose,
  profile,
  onSuccess
}) => {
  const { t, i18n } = useTranslation(['invitation','common']);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      await InvitationService.createInvitation({
        profile_id: profile.id,
        email,
        language: i18n.language
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(t('invitation.create_error'));
      console.error('Error creating invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('invitation.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography sx={{ mb: 3 }} color="text.secondary">
          {t('invitation.info')}
        </Typography>
        
        <div style={{ borderRadius: '8px', width:'100%'}}>
          <img src="/img/invitation-dialog.jpg" style={{ borderRadius: '8px', width:'100%' }}/>
        </div>
        
        <TextField
          fullWidth
          label={t('invitation.email_label')}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !email}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {t('invitation.send')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvitationDialog;