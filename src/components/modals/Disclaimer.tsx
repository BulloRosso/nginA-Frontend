// src/components/modals/Disclaimer.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useDisclaimer } from '../../contexts/disclaimer';

export const Disclaimer = () => {
  const { t } = useTranslation('about');
  const { isOpen, closeDisclaimer } = useDisclaimer();

  return (
    <Dialog 
      open={isOpen} 
      onClose={closeDisclaimer}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{t('about.title')}</DialogTitle>
      <DialogContent>
       <img src="/img/splash-screen.jpg"></img>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDisclaimer}>{t('about.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};