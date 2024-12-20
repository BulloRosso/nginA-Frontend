// src/components/profile/SetupStep3.tsx
import React, { useState, useEffect } from 'react';
import { SetupStepProps } from '../../types/profile-setup';
import { Box } from '@mui/material';
import { NarratorSettings } from '../modals/NarratorSettings';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

export const SetupStep3: React.FC<SetupStepProps> = ({ 
  profile, 
  setProfile 
}) => {
  const { t } = useTranslation();
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

        // Update both local state and form state
        const newSettings = {
          narrator_perspective: profile.narrator_perspective || 'ego',
          narrator_verbosity: profile.narrator_verbosity || 'normal',
          narrator_style: profile.narrator_style || 'neutral'
        };
        setSettings(newSettings);

        // Update parent form state
        setProfile(prev => ({
          ...prev,
          narratorPerspective: newSettings.narrator_perspective,
          narratorStyle: newSettings.narrator_style,
          narratorVerbosity: newSettings.narrator_verbosity
        }));
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = async (key: string, value: string) => {
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

      // Update form state
      const formKey = key.replace('narrator_', 'narrator');
      setProfile(prev => ({
        ...prev,
        [formKey]: value
      }));

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
      // Revert settings on error
      const userId = JSON.parse(localStorage.getItem('user')).id;
      const response = await api.get(`/api/v1/auth/profile/${userId}`);
      const profile = response.data?.profile || {};
      setSettings({
        narrator_perspective: profile.narrator_perspective || 'ego',
        narrator_verbosity: profile.narrator_verbosity || 'normal',
        narrator_style: profile.narrator_style || 'neutral'
      });
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 4 }} color="text.secondary">
          {t('profile.step3_description')}
      </Box>
      <NarratorSettings 
        settings={settings}
        onSettingChange={handleSettingChange}
      />
    </Box>
  );
};