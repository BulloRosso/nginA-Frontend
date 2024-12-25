// src/components/profile/SetupStep2.tsx
import React from 'react';
import { SetupStepProps } from '../../types/profile-setup';
import { Box, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

export const SetupStep2: React.FC<SetupStepProps> = ({ 
  profile, 
  setProfile, 
  errors 
}) => {
  const { t } = useTranslation(["profile","common"]);

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body1" gutterBottom color="text.secondary" sx={{ mb: 3 }}>
        {t('profile.backstory.description')}
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={8}
        label={t('profile.backstory.label')}
        value={profile.backstory}
        onChange={(e) => setProfile(prev => ({ ...prev, backstory: e.target.value }))}
        placeholder={t('profile.backstory.placeholder')}
        error={!!errors.backstory}
        helperText={errors.backstory}
      />
    </Box>
  );
};