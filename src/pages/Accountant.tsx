// src/pages/Accountant.tsx
import React, { useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import CreditDashboard from '../components/accounting/CreditDashboard';
import AccountantBot from '../components/AccountantBot';
import useAgentStore from '../../stores/agentStore';

const Accountant: React.FC = () => {
  const { t } = useTranslation(['common']);
  const { fetchCreditReport, fetchAgentsAndTeam } = useAgentStore();

  // Pre-fetch the data when component mounts
  useEffect(() => {
    // Fetch accounting data
    fetchCreditReport();

    // Also fetch agents data to ensure we have the latest agent information
    // This is helpful for the chart which shows agent names
    fetchAgentsAndTeam();
  }, [fetchCreditReport, fetchAgentsAndTeam]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <CreditDashboard />
        </Paper>
      </Box>

      <AccountantBot />

    </Container>
  );
};

export default Accountant;