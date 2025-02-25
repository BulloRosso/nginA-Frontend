// src/pages/Accountant.tsx
import React, { useState } from 'react';
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

const Accountant: React.FC = () => {
  const { t } = useTranslation(['common']);

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