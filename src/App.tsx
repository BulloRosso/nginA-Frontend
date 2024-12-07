// src/App.tsx
import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { LanguageSwitch } from './components/common/LanguageSwitch';
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';

const App = () => {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Noblivion
              </Typography>
              <LanguageSwitch />
            </Toolbar>
          </AppBar>
  
          <Routes>
            <Route path="/" element={<ProfileSelection />} />
            <Route path="/profile" element={<ProfileSetup />} />
            <Route path="/interview" element={<MemoryCapture />} />
            <Route path="/timeline" element={
              <MemoryTimeline 
                memories={[]}
                onMemorySelect={(memory) => console.log('Selected memory:', memory)}
              />
            } />
          </Routes>
        </Box>
      </BrowserRouter>
    </I18nextProvider>
  );
};

export default App;