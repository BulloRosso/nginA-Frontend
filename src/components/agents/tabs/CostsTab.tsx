// components/agents/tabs/CostsTab.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Agent } from '../../../types/agent';

export const CostsTab: React.FC<{ agent: Agent }> = ({ agent }) => (
  <Box p={2}>
    <Typography variant="h6" gutterBottom>
      Credits per Run: {agent.credits_per_run}
    </Typography>
    {/* Add more costs & runtime information here */}
  </Box>
);