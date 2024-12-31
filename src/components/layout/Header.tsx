// src/components/layout/Header.tsx
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Stack, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { 
  LogoutRounded,
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  MailOutline as InviteIcon
} from '@mui/icons-material';
import { LanguageSwitch } from '../common/LanguageSwitch';
import Settings from '../modals/Settings';
import { useAuth } from '../../contexts/auth';
import { useTranslation } from 'react-i18next';

const AppMenu = ({ anchorEl, onClose, isAuthenticated }) => {
  const { t } = useTranslation(['common']);
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

  const menuItems = [
    <MenuItem key="home" onClick={() => handleNavigation('/')}>
      <ListItemIcon>
        <HomeIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('common.menu.home')} />
    </MenuItem>,

    <MenuItem key="profiles" onClick={() => handleNavigation('/profile-selection')}>
      <ListItemIcon>
        <PeopleIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('common.menu.profiles')} />
    </MenuItem>,

    <MenuItem key="invitations" onClick={() => handleNavigation('/invitations')}>
      <ListItemIcon>
        <InviteIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('common.menu.invitations')} />
    </MenuItem>
  ];

  if (isAuthenticated) {
    menuItems.push(
      <Divider key="divider" />,
      <MenuItem key="logout" onClick={handleLogout}>
        <ListItemIcon>
          <LogoutRounded fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={t('common.menu.logout')} />
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

export const Header = () => {
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
          setProfileName(parsedProfile.first_name);
        } catch (error) {
          console.error('Error parsing profiles:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    updateProfileName();
  }, [updateProfileName]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'profileId' || event.key === 'profiles') {
        updateProfileName();
      }
    };

    const handleCustomEvent = (event: CustomEvent) => {
      updateProfileName();
    };

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

  let pn = t('common.sessionwith') + ' ' + profileName;
  if ( t('common.sessionwith').indexOf('{{person}}') > -1  ) {
    pn = t('common.sessionwith').replace('{{person}}', profileName)
  }

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
              {pn}
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