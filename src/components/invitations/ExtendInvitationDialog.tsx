// src/components/invitations/ExtendInvitationDialog.tsx
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
  Typography,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { InvitationService } from '../../services/invitations';
import { Invitation } from '../../types/invitation';
import { format, addDays } from 'date-fns';

interface ExtendInvitationDialogProps {
  open: boolean;
  onClose: () => void;
  invitation: Invitation | null;
  onSuccess: () => void;
}

const ExtendInvitationDialog: React.FC<ExtendInvitationDialogProps> = ({
  open,
  onClose,
  invitation,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [days, setDays] = useState('14');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!invitation) return;

    try {
      setLoading(true);
      setError(null);

      await InvitationService.extendInvitation(
        invitation.id,
        parseInt(days, 10)
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(t('invitation.extend_error'));
      console.error('Error extending invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const newExpiryDate = invitation 
    ? addDays(new Date(), parseInt(days, 10))
    : null;

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('invitation.extend_title')}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {invitation && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t('invitation.current_invitee')}: <strong>{invitation.email}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('invitation.expires_on')}: <strong>
                {format(new Date(invitation.expires_at), 'PPP')}
              </strong>
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          label={t('invitation.days_label')}
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          inputProps={{ min: 1, max: 30 }}
          margin="normal"
          disabled={loading}
        />

        {newExpiryDate && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {t('invitation.new_expiry')}: <strong>
              {format(newExpiryDate, 'PPP')}
            </strong>
          </Typography>
        )}
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
          onClick={handleSubmit}
          disabled={loading || parseInt(days, 10) < 1 || parseInt(days, 10) > 30}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {t('invitation.extend')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExtendInvitationDialog;