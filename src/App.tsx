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
import { Login, Register, ForgotPassword } from './components/auth';
import { AuthProvider } from './contexts/auth';
import { VerificationCheck, VerifiedRoute } from './components/verification';
import LandingPage from './pages/LandingPage';  
import IntroductionVideo from './pages/IntroductionVideo';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1eb3b7',
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('token'); // Or your auth check

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>

            <VerificationCheck />
            
            {/* Only show AppBar on non-landing pages */}
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="*"
                element={
                  <Box sx={{ flexGrow: 1 }}>
                    <AppBar position="static" sx={{ backgroundColor: '#1eb3b7'}}>
                      <Toolbar variant="dense">
                        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                          nOblivion
                        </Typography>
                        <LanguageSwitch />
                      </Toolbar>
                    </AppBar>

                    <Routes>
                      {/* Public routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />

                      {/* Protected and verified routes */}
                      <Route path="/profile-selection" element={
                        <ProtectedRoute>
                          <VerifiedRoute>
                            <ProfileSelection />
                          </VerifiedRoute>
                        </ProtectedRoute>
                      } />

                      <Route path="/profile" element={
                            <ProfileSetup />
                      } />

                      {/* New route for introduction video */}
                      <Route path="/introduction" element={
                            <IntroductionVideo />
                      } />

                      <Route path="/interview" element={
                        
                            <MemoryCapture />
                        
                      } />

                      <Route path="/timeline" element={
                        <ProtectedRoute>
                          <VerifiedRoute>
                            <MemoryTimeline 
                              memories={[]}
                              onMemorySelect={(memory) => console.log('Selected memory:', memory)}
                            />
                          </VerifiedRoute>
                        </ProtectedRoute>
                      } />
                    </Routes>
                  </Box>
                }
              />
            </Routes>
            
          </BrowserRouter>
        </I18nextProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;