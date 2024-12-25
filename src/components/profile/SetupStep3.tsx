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
  const { t } = useTranslation(["profile","common"]);
  const [settings, setSettings] = useState({
    narrator_perspective: 'ego',
    narrator_verbosity: 'normal',
    narrator_style: 'neutral'
  });

  const handleSettingChange = async (key: string, value: string) => {
    try {
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

      // Optional: Update backend only after form submission
      // Remove immediate API call that causes reload
    } catch (err) {
      console.error('Settings update error:', err);
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