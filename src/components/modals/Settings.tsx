import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { Tune as SettingsIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const Settings = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found');
      }
      const userId = JSON.parse(userData).id;

      const response = await api.get(`/api/v1/auth/profile/${userId}`);
      const currentProfile = response.data?.profile || {};

      // Merge existing profile with new settings
      const updatedProfile = {
        ...currentProfile,
        ...settings
      };

      await api.post('/api/v1/auth/profile', {
        profile: updatedProfile
      });

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Settings save error:', err);
      if (err.response?.status === 401) {
        // Only show auth error if it's not a token validation issue
        const errorDetail = err.response.data?.detail || '';
        if (!errorDetail.includes('Invalid token') && 
            !errorDetail.includes('Token has expired') &&
            !errorDetail.includes('Could not validate credentials')) {
          setError(t('settings.auth_error'));
        }
      } else {
        setError(t('settings.save_error'));
      }
    } finally {
      setLoading(false);
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
        <DialogTitle>
          {t('settings.title')}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success">
                {t('settings.save_success')}
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>{t('settings.narrator_perspective')}</InputLabel>
              <Select
                value={settings.narrator_perspective}
                label={t('settings.narrator_perspective')}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  narrator_perspective: e.target.value
                }))}
              >
                <MenuItem value="ego">{t('settings.perspective.ego')}</MenuItem>
                <MenuItem value="3rd-person">{t('settings.perspective.third_person')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('settings.narrator_verbosity')}</InputLabel>
              <Select
                value={settings.narrator_verbosity}
                label={t('settings.narrator_verbosity')}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  narrator_verbosity: e.target.value
                }))}
              >
                <MenuItem value="verbose">{t('settings.verbosity.verbose')}</MenuItem>
                <MenuItem value="normal">{t('settings.verbosity.normal')}</MenuItem>
                <MenuItem value="brief">{t('settings.verbosity.brief')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>{t('settings.narrator_style')}</InputLabel>
              <Select
                value={settings.narrator_style}
                label={t('settings.narrator_style')}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  narrator_style: e.target.value
                }))}
              >
                <MenuItem value="professional">{t('settings.style.professional')}</MenuItem>
                <MenuItem value="romantic">{t('settings.style.romantic')}</MenuItem>
                <MenuItem value="optimistic">{t('settings.style.optimistic')}</MenuItem>
                <MenuItem value="neutral">{t('settings.style.neutral')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={() => setOpen(false)} 
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Settings;