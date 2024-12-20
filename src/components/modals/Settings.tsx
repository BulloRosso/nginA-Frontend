// src/components/modals/Settings.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  Box
} from '@mui/material';
import { 
  Tune as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { NarratorSettings } from './NarratorSettings';

const Settings = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    narrator_perspective: 'ego',
    narrator_verbosity: 'normal',
    narrator_style: 'neutral'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        const response = await api.get(`/api/v1/auth/profile/${userId}`);
        const profile = response.data?.profile || {};

        setSettings({
          narrator_perspective: profile.narrator_perspective || 'ego',
          narrator_verbosity: profile.narrator_verbosity || 'normal',
          narrator_style: profile.narrator_style || 'neutral'
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    if (open) {
      fetchSettings();
    }
  }, [open]);

  const updateSettings = async (key: string, value: string) => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found');
      }
      const userId = JSON.parse(userData).id;

      // Update local state
      const newSettings = {
        ...settings,
        [key]: value
      };
      setSettings(newSettings);

      // Get current profile
      const response = await api.get(`/api/v1/auth/profile/${userId}`);
      const currentProfile = response.data?.profile || {};

      // Update backend
      await api.post('/api/v1/auth/profile', {
        profile: {
          ...currentProfile,
          ...newSettings
        }
      });

    } catch (err) {
      console.error('Settings update error:', err);
      setError(t('settings.save_error'));
      // Revert settings on error
      fetchSettings();
    }
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{ 
          color: 'white',
          '&:hover': { opacity: 0.8 }
        }}
      >
        <SettingsIcon />
      </IconButton>

      <Dialog 
        open={open} 
        onClose={() => !loading && setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          {t('settings.title')}
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError('')}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          <NarratorSettings 
            settings={settings}
            onSettingChange={updateSettings}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings;