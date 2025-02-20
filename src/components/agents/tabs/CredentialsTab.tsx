// components/agents/tabs/CredentialsTab.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Agent } from '../../../types/agent';

export const CredentialsTab: React.FC<{ agent: Agent }> = ({ agent }) => (
  <Box p={2}>
    {/* Add credentials content here */}
    <Typography>Credentials content</Typography>
  </Box>
);