// src/components/profile/SetupStep3.tsx
import React from 'react';
import { SetupStepProps } from '../../types/profile-setup';
import { Box } from '@mui/material';
import { NarratorSettings } from '../modals/NarratorSettings';
import { useTranslation } from 'react-i18next';

export const SetupStep3: React.FC<SetupStepProps> = ({ 
  profile, 
  setProfile 
}) => {
  const { t } = useTranslation(["profile","common"]);

  const handleSettingChange = (key: string, value: string) => {
    console.log('Setting change in SetupStep3:', key, value);

    // Convert snake_case to camelCase with proper capitalization
    const formKey = key === 'narrator_perspective' ? 'narratorPerspective' :
                   key === 'narrator_style' ? 'narratorStyle' :
                   key === 'narrator_verbosity' ? 'narratorVerbosity' :
                   key;

    console.log('Updating profile with key:', formKey, 'value:', value);

    setProfile(prev => {
      const newProfile = {
        ...prev,
        [formKey]: value
      };
      console.log('New profile state:', newProfile);
      return newProfile;
    });
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ mb: 4 }} color="text.secondary">
          {t('profile.step3_description')}
      </Box>
      <NarratorSettings 
        settings={{
          narrator_style: profile.narratorStyle,
          narrator_perspective: profile.narratorPerspective,
          narrator_verbosity: profile.narratorVerbosity
        }}
        onSettingChange={handleSettingChange}
      />
    </Box>
  );
};