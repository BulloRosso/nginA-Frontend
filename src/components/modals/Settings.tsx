import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Grid
} from '@mui/material';
import { 
  Tune as SettingsIcon,
  Close as CloseIcon,
  PsychologyAlt as PsychologyIcon,
  Chat as ChatIcon,
  FavoriteBorder as StyleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

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

          <Box sx={{ mt: 2 }}>
            {/* Perspective Setting */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={1}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <PsychologyIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                </Box>
              </Grid>
              <Grid item xs={11}>
                <FormControl fullWidth>
                  <InputLabel>{t('settings.narrator_perspective')}</InputLabel>
                  <Select
                    value={settings.narrator_perspective}
                    label={t('settings.narrator_perspective')}
                    onChange={(e) => updateSettings('narrator_perspective', e.target.value)}
                  >
                    <MenuItem value="ego">{t('settings.perspective.ego')}</MenuItem>
                    <MenuItem value="3rd-person">{t('settings.perspective.third_person')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Verbosity Setting */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={1}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ChatIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                </Box>
              </Grid>
              <Grid item xs={11}>
                <FormControl fullWidth>
                  <InputLabel>{t('settings.narrator_verbosity')}</InputLabel>
                  <Select
                    value={settings.narrator_verbosity}
                    label={t('settings.narrator_verbosity')}
                    onChange={(e) => updateSettings('narrator_verbosity', e.target.value)}
                  >
                    <MenuItem value="verbose">{t('settings.verbosity.verbose')}</MenuItem>
                    <MenuItem value="normal">{t('settings.verbosity.normal')}</MenuItem>
                    <MenuItem value="brief">{t('settings.verbosity.brief')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Style Setting */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={1}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <StyleIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
                </Box>
              </Grid>
              <Grid item xs={11}>
                <FormControl fullWidth>
                  <InputLabel>{t('settings.narrator_style')}</InputLabel>
                  <Select
                    value={settings.narrator_style}
                    label={t('settings.narrator_style')}
                    onChange={(e) => updateSettings('narrator_style', e.target.value)}
                  >
                    <MenuItem value="professional">{t('settings.style.professional')}</MenuItem>
                    <MenuItem value="romantic">{t('settings.style.romantic')}</MenuItem>
                    <MenuItem value="optimistic">{t('settings.style.optimistic')}</MenuItem>
                    <MenuItem value="neutral">{t('settings.style.neutral')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Settings;