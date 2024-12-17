import './App.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { LanguageSwitch } from './components/common/LanguageSwitch';
import { Box, AppBar, Toolbar, Typography, IconButton, Stack } from '@mui/material';
import { LogoutRounded } from '@mui/icons-material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Login, Register, ForgotPassword } from './components/auth';
import { AuthProvider, useAuth } from './contexts/auth';
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

const Header = () => {
  const { logout } = useAuth();
  const [profileName, setProfileName] = React.useState<string>('');

  React.useEffect(() => {
    const updateProfileName = () => {
      const profileId = localStorage.getItem('profileId');
      const profiles = localStorage.getItem('profiles');

      if (profileId && profiles) {
        try {
          const parsedProfiles = JSON.parse(profiles);
          const selectedProfile = parsedProfiles.find(p => p.id === profileId);
          if (selectedProfile) {
            setProfileName(selectedProfile.first_name);
          }
        } catch (error) {
          console.error('Error parsing profiles:', error);
        }
      }
    };

    // Update initially
    updateProfileName();

    // Listen for storage changes
    window.addEventListener('storage', updateProfileName);

    return () => {
      window.removeEventListener('storage', updateProfileName);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Check for either token or user in localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isAuthenticated = !!(token || user);

  return (
    <AppBar position="static" sx={{ backgroundColor: '#1eb3b7'}}>
      <Toolbar variant="dense">
        <img src="/public/conch-logo.png" alt="Conch Logo" width="30" height="30" />
        <Typography variant="h6" component="div" sx={{ 
          marginLeft: '8px',
          fontWeight: 'bold', 
          flexGrow: 1 
        }}>
          <span style={{ color: 'red' }}>nO</span>blivion
          {profileName && (
            <span style={{ 
              marginLeft: '16px', 
              fontSize: '0.9em',
              fontWeight: '400',
              color: '#fff',
              opacity: 0.9 
            }}>
              session with {profileName}
            </span>
          )}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <LanguageSwitch />
          {isAuthenticated && (
            <IconButton 
              color="inherit"
              onClick={handleLogout}
              size="small"
              sx={{ ml: 1 }}
            >
              <LogoutRounded />
            </IconButton>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

const AppLayout = ({ children }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Header />
      <VerificationCheck />
      {children}
    </Box>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <I18nextProvider i18n={i18n}>
          <BrowserRouter>
            <Routes>
              {/* Landing page - no header */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth routes - no header */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected routes - with header */}
              <Route path="/profile-selection" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <ProfileSelection />
                  </VerifiedRoute>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfileSetup />
                </ProtectedRoute>
              } />

              <Route path="/introduction" element={
                <ProtectedRoute>
                  <IntroductionVideo />
                </ProtectedRoute>
              } />

              <Route path="/interview" element={
                <ProtectedRoute>
                  <MemoryCapture />
                </ProtectedRoute>
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
          </BrowserRouter>
        </I18nextProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;