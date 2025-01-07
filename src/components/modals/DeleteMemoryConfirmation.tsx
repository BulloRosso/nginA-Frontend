// src/components/modals/DeleteMemoryConfirmation.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface DeleteMemoryConfirmationProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  memoryCaption: string;
  isDeleting: boolean;
}

const DeleteMemoryConfirmation: React.FC<DeleteMemoryConfirmationProps> = ({
  open,
  onClose,
  onConfirm,
  memoryCaption,
  isDeleting
}) => {
  const { t } = useTranslation(['memory', 'common']);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting memory:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!isProcessing ? onClose : undefined}
      TransitionProps={{
        onExited: () => setIsProcessing(false)
      }}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
        }
      }}
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          {t('memory.delete_confirmation.title')}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          {t('memory.delete_confirmation.message')}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ 
            mt: 2,
            p: 2,
            bgcolor: 'grey.100',
            borderRadius: 1,
            fontStyle: 'italic'
          }}
        >
          "{memoryCaption}"
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          disabled={isProcessing}
          variant="outlined"
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isProcessing}
          variant="contained"
          color="error"
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
        >
          {t('memory.delete_confirmation.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteMemoryConfirmation;