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
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1eb3b7',
    },
  },
});

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>
          <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static" sx={{ backgroundColor: '#1eb3b7'}}>
              <Toolbar>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                  nOblivion
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
    </ThemeProvider>
  );
};

export default App;