// src/components/modals/NarratorSettings.tsx
import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { 
  PsychologyAlt as PsychologyIcon,
  Chat as ChatIcon,
  FavoriteBorder as StyleIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface NarratorSettingsProps {
  settings: {
    narrator_perspective: string;
    narrator_verbosity: string;
    narrator_style: string;
  };
  onSettingChange: (key: string, value: string) => void;
}

export const NarratorSettings: React.FC<NarratorSettingsProps> = ({
  settings,
  onSettingChange
}) => {
  const { t } = useTranslation(['settings','common']);


  
  return (
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
              onChange={(e) => onSettingChange('narrator_perspective', e.target.value)}
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
              onChange={(e) => onSettingChange('narrator_verbosity', e.target.value)}
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
              onChange={(e) => onSettingChange('narrator_style', e.target.value)}
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
  );
};