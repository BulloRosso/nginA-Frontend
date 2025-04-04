// src/components/layout/Header.tsx
import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, Stack, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { 
  LogoutRounded,
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  MailOutline as InviteIcon,
  InfoOutlined as InfoIcon,
  MessageOutlined as PromptIcon,
} from '@mui/icons-material';
import { LanguageSwitch } from '../common/LanguageSwitch';
import Settings from '../modals/Settings';
import { useAuth } from '../../contexts/auth';
import { useTranslation } from 'react-i18next';
import { useDisclaimer } from '../../contexts/disclaimer';

const AppMenu = ({ anchorEl, onClose, isAuthenticated }) => {
  const { t } = useTranslation(['common', 'about']);
  const { openDisclaimer } = useDisclaimer();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleAboutClick = () => {
    onClose();
    openDisclaimer();
  };

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

    <MenuItem key="about" onClick={handleAboutClick}>
      <ListItemIcon>
        <InfoIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary={t('about:about.menuItem')} />
    </MenuItem>,

    <MenuItem key="prompts" onClick={() => handleNavigation('/prompts')}>
      <ListItemIcon>
        <PromptIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText primary="Prompt Editor" />
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
        <Typography variant="h6" component="div" sx={{ 

          fontWeight: 'bold', 
          flexGrow: 1 
        }}>
          ngin<span style={{ color: 'red' }}>A</span>
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