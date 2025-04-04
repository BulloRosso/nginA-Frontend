// src/components/layout/AppLayout.tsx
import React from 'react';
import { Box } from '@mui/material';
import { Header } from './Header';  // Move Header component here too
import { VerificationCheck } from '../verification';
import { NavigationItems } from './NavigationItems';

export const AppLayout = ({ children }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header />
      <NavigationItems />
      <VerificationCheck />
      {children}
    </Box>
  );
};