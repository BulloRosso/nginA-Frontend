import './App.css';
import React, { useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MemoryTimeline from './components/common/MemoryTimeline';
import ProfileSetup from './pages/ProfileSetup';
import MemoryCapture from './pages/MemoryCapture';
import ProfileSelection from './pages/ProfileSelection';
import { LanguageSwitch } from './components/common/LanguageSwitch';
import { Box, AppBar, Toolbar, Typography, IconButton, Stack, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { 
  LogoutRounded,
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Login, Register, ForgotPassword } from './components/auth';
import { AuthProvider, useAuth } from './contexts/auth';
import { VerificationCheck, VerifiedRoute } from './components/verification';
import LandingPage from './pages/LandingPage';  
import IntroductionVideo from './pages/IntroductionVideo';
import { useTranslation } from 'react-i18next';
import ChatRobot from './components/chat/ChatRobot';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1eb3b7',
    },
  },
});

const AppMenu = ({ anchorEl, onClose, isAuthenticated }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    logout();
    window.location.href = '/login';
  };

  // Create menu items array conditionally
  const menuItems = [
    // Basic navigation items
    <MenuItem key="home" onClick={() => handleNavigation('/')}>
      <ListItemIcon>
        <HomeIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('menu.home')} />
    </MenuItem>,

    <MenuItem key="profiles" onClick={() => handleNavigation('/profile-selection')}>
      <ListItemIcon>
        <PeopleIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('menu.profiles')} />
    </MenuItem>
  ];

  // Add logout items if authenticated
  if (isAuthenticated) {
    menuItems.push(
      <Divider key="divider" />,
      <MenuItem key="logout" onClick={handleLogout}>
        <ListItemIcon>
          <LogoutRounded fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('menu.logout')} />
      </MenuItem>
    );
  }

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      {menuItems}
    </Menu>
  );
};

const Header = () => {
  const { logout } = useAuth();
  const [profileName, setProfileName] = React.useState<string>('');
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { t } = useTranslation();

  const updateProfileName = useCallback(() => {
    const profileId = localStorage.getItem('profileId');
    setProfileName(null);
    if (profileId) {
      const profiles = localStorage.getItem('profiles');
      if (profiles) {
        try {
          const parsedProfile = JSON.parse(profiles);
          console.log("PARSING")
          setProfileName(parsedProfile.first_name);
          
        } catch (error) {
          console.error('Error parsing profiles:', error);
        }
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    updateProfileName();
  }, [updateProfileName]);

  // Listen for storage changes
  useEffect(() => {
    // Handler for storage events
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'profileId' || event.key === 'profiles') {
        updateProfileName();
      }
    };

    // Handler for direct calls
    const handleCustomEvent = (event: CustomEvent) => {
      updateProfileName();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileSelected', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileSelected', handleCustomEvent as EventListener);
    };
  }, [updateProfileName]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
              {t('appbar.sessionwith')} {profileName}
            </span>
          )}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <LanguageSwitch />
        </Stack>

        {isAuthenticated && (
          <IconButton
            size="small"
            color="inherit"
            onClick={handleMenuOpen}
            sx={{ ml: 1, color: 'white' }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <AppMenu 
          anchorEl={anchorEl}
          onClose={handleMenuClose}
          isAuthenticated={isAuthenticated}
        />
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

              <Route path="/chat" element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <ChatRobot />
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