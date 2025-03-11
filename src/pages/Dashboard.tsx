import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { AuthService } from '../services/auth';
import DashboardFromLayout from '../components/dashboards/DashboardFromLayout';
import { getUserRoleFromToken } from '../utils/jwtDecode';

interface LoginData {
  email: string;
  password: string;
  error: string | null;
}

const Dashboard: React.FC = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [openLoginModal, setOpenLoginModal] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: '',
    error: null
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [dashboardTitle, setDashboardTitle] = useState<string>('Dashboard');

  // Check if already authenticated via sessionStorage
  useEffect(() => {
    const token = sessionStorage.getItem('dashboard_token');
    console.log('Initial authentication check - token exists:', !!token);

    if (token) {
      // Extract user role from token
      const role = getUserRoleFromToken(token);
      console.log('Extracted role from token:', role);

      setUserRole(role);
      setIsAuthenticated(true);
      setOpenLoginModal(false);
    } else {
      console.log('No token found, showing login modal');
    }
  }, []);

  // Listen for token removal (e.g., session expiry)
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = sessionStorage.getItem('dashboard_token');
      if (!token && isAuthenticated) {
        setIsAuthenticated(false);
        setUserRole(null);
        setOpenLoginModal(true);
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkAuthStatus, 30000);

    // Also add storage event listener to catch manual removals
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard_token' && e.newValue === null) {
        setIsAuthenticated(false);
        setUserRole(null);
        setOpenLoginModal(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({
      ...loginData,
      [name]: value,
      error: null
    });
  };

  const handleLogin = async () => {
    try {
      // Validate form
      if (!loginData.email || !loginData.password) {
        setLoginData({
          ...loginData,
          error: 'Email and password are required'
        });
        return;
      }

      // Set loading state and clear errors
      setIsLoggingIn(true);
      setLoginData({
        ...loginData,
        error: null
      });

      console.log('Attempting login for:', loginData.email);

      // Use the dashboard-specific login function
      const response = await AuthService.dashboardLogin(loginData.email, loginData.password);

      console.log('Login response received:', response);

      if (response.access_token) {
        console.log('Access token received');
        // Token is already stored in sessionStorage by dashboardLogin
        // Store user data
        sessionStorage.setItem('dashboard_user', JSON.stringify(response.user));

        // Extract user role from token
        const role = getUserRoleFromToken(response.access_token);
        console.log('Extracted role from token:', role);
        setUserRole(role);

        // Update authentication state
        setIsAuthenticated(true);
        setOpenLoginModal(false);
      } else if (response.mfa_required) {
        console.log('MFA required for this user');
        // Handle MFA if needed, for simplicity we're not implementing MFA for this demo
        setLoginData({
          ...loginData,
          error: 'MFA is required but not supported in this view'
        });
      } else {
        console.log('No access token in response:', response);
        setLoginData({
          ...loginData,
          error: 'Invalid response from server'
        });
      }
    } catch (error: any) {
      console.error('Login error details:', error);

      // Handle specific error cases
      if (error.name === 'EmailNotConfirmedError') {
        setLoginData({
          ...loginData,
          error: 'Please confirm your email before logging in'
        });
      } else if (error.response?.status === 401) {
        setLoginData({
          ...loginData,
          error: 'Invalid email or password'
        });
      } else {
        setLoginData({
          ...loginData,
          error: error.message || 'Authentication failed. Please try again.'
        });
      }
    } finally {
      // Always reset loading state
      setIsLoggingIn(false);
    }
  };

  // Handle enter key press in login form
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('dashboard_token');
    sessionStorage.removeItem('dashboard_user');
    setIsAuthenticated(false);
    setUserRole(null);
    setOpenLoginModal(true);
    handleMenuClose();
  };

  // Set dashboard title when dashboard data is fetched
  const updateDashboardTitle = (title: string) => {
    setDashboardTitle(title);
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Login Modal */}
      <Dialog open={openLoginModal} onClose={() => {}} maxWidth="sm" fullWidth>
        <DialogTitle>Welcome to your automations</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={loginData.email}
              onChange={handleInputChange}
              margin="normal"
              onKeyPress={handleKeyPress}
              autoFocus
              error={!!loginData.error}
              disabled={isLoggingIn}
              InputProps={{
                readOnly: isLoggingIn,
              }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={loginData.password}
              onChange={handleInputChange}
              margin="normal"
              onKeyPress={handleKeyPress}
              error={!!loginData.error}
              disabled={isLoggingIn}
              InputProps={{
                readOnly: isLoggingIn,
              }}
            />
            {loginData.error && (
              <Typography color="error" variant="body2" sx={{ mt: 1, mb: 1 }}>
                {loginData.error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleLogin} 
            color="primary" 
            variant="contained"
            disabled={!loginData.email || !loginData.password || isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Log In'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dashboard content - only shown after authentication */}
      {isAuthenticated && dashboardId && (
        <>
          {/* App Bar with Burger Menu */}
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {dashboardTitle}
              </Typography>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                sx={{ mt: '45px' }}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Role ({userRole || 'Unknown'})</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>

          {/* Main Content */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {/* Show content based on role */}
            {userRole === 'developer' ? (
              <DashboardFromLayout 
                dashboardId={dashboardId} 
                isDeveloper={true} 
                onTitleChange={updateDashboardTitle}
              />
            ) : userRole === 'customer' ? (
              <DashboardFromLayout 
                dashboardId={dashboardId} 
                isDeveloper={false}
                onTitleChange={updateDashboardTitle} 
              />
            ) : (
              <Box>
                {/* Default view if role not detected - use customer view as fallback */}
                <Typography variant="caption" color="error" sx={{ position: 'absolute', top: '70px', left: '10px', zIndex: 1000 }}>
                  Unknown role - using default view
                </Typography>
                <DashboardFromLayout 
                  dashboardId={dashboardId} 
                  isDeveloper={false}
                  onTitleChange={updateDashboardTitle}
                />
              </Box>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;