// src/pages/AgentOperator.tsx
import React, { useEffect, Suspense, useTransition } from 'react';
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
import useAgentStore from '../../stores/agentStore';

interface AgentOperatorProps {
  onSelect?: (profileId: string) => void;
}

const AgentOperator: React.FC<AgentOperatorProps> = ({ onSelect }) => {
  const [isPending, startTransition] = useTransition();
  const { t, i18n } = useTranslation(['agents','profile', 'common']);

  // Pre-fetch data when component mounts
  const { fetchAgentsAndTeam, fetchTeamStatus } = useAgentStore();

  useEffect(() => {
    // Start loading data when the component mounts
    startTransition(() => {
      fetchAgentsAndTeam();
      fetchTeamStatus();
    });
  }, [fetchAgentsAndTeam, fetchTeamStatus]);

  // Map i18n languages to date-fns locales
  const locales = {
    'de': de,
    'en': enUS,
    // Add more locales as needed
  };

  const getCurrentLocale = () => {
    return locales[i18n.language] || enUS;  // fallback to English
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, paddingBottom: 0  }}>
          <Typography variant="h5" sx={{ mb: '24px' }}>
            {t('agents.select_agent')}
          </Typography>

          <Suspense fallback={<CircularProgress />}>
            {isPending ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <TeamStatus />
            )}
          </Suspense>

        </Paper>
      </Box>

      <SupportBot />

    </Container>
  );
};

export default AgentOperator;