// src/pages/ProfileSelection.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box,
  CircularProgress
} from '@mui/material';

import { de, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import './styles/GoldButton.css';
import SupportBot from '../components/SupportBot';
import TeamStatus from '../components/agents/TeamStatus';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const AgentOperator: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  
  const loading = false;
  const error = null;
  const { t, i18n } = useTranslation(['agents','profile', 'invitation', 'interview', 'common']);

  // Map i18n languages to date-fns locales
  const locales = {
    'de': de,
    'en': enUS,
    // Add more locales as needed
  };

  const getCurrentLocale = () => {
    return locales[i18n.language] || enUS;  // fallback to English
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, paddingBottom: 0  }}>
          <Typography variant="h5" sx={{ mb: '24px' }}>
            {t('agents.select_agent')}
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

           <TeamStatus />
          
        </Paper>
      </Box>

      <SupportBot />
      
    </Container>
  );
};

export default AgentOperator;