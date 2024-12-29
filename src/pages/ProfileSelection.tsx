// src/pages/ProfileSelection.tsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  List, 
  ListItem,
  Avatar,
  Button,
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  LogoutRounded,
  Menu as MenuIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  SmartToy as RobotIcon,
  AutoFixHigh as MagicWandIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  ForumOutlined as ForumIcon,
  PersonAdd as PersonAddIcon,
  MailOutline as InviteIcon, 
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Profile, calculateAge } from '../types/profile';
import { formatDistance } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { ProfileService } from '../services/profiles';
import { useTranslation } from 'react-i18next';
import BuyProduct from '../components/modals/BuyProduct';
import './styles/GoldButton.css';
import InvitationDialog from '../components/modals/InvitationDialog';
import SupportBot from '../components/SupportBot';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const ProfileSelection: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    localStorage.getItem('profileId')
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['profile','common']);

  // Map i18n languages to date-fns locales
  const locales = {
    'de': de,
    'en': enUS,
    // Add more locales as needed
  };

  const getCurrentLocale = () => {
    return locales[i18n.language] || enUS;  // fallback to English
  };
  
  // Single effect for initialization
  useEffect(() => {
      const initializeProfileSelection = async () => {
          try {
              // Clear local storage at component mount
              localStorage.removeItem('profileId');
              localStorage.removeItem('profiles');
              window.dispatchEvent(new CustomEvent('profileSelected'));

              // Get current user ID from localStorage
              const userData = localStorage.getItem('user');
              if (!userData) {
                  setError('No user data found. Please log in again.');
                  return;
              }

              const user = JSON.parse(userData);

              // Use new method to fetch profiles for current user
              const userProfiles = await ProfileService.getProfilesForUser(user.id);
              setProfiles(userProfiles);

              // If there are profiles, select the first one by default
              if (userProfiles.length > 0) {
                  const firstProfile = userProfiles[0];
                  localStorage.setItem('profileId', firstProfile.id);
                  localStorage.setItem('profiles', JSON.stringify(firstProfile));
                  setSelectedProfileId(firstProfile.id);
                  window.dispatchEvent(new CustomEvent('profileSelected'));
              }

          } catch (error) {
              console.error('Error fetching profiles:', error);
              setError('Failed to load profiles. Please try again.');
          } finally {
              setLoading(false);
          }
      };

      initializeProfileSelection();
  }, []);

  const handleProfileSelect = (profileId: string) => {
    const selectedProfile = profiles.find(p => p.id === profileId);

    if (selectedProfile) {
      localStorage.setItem('profileId', profileId);
      localStorage.setItem('profiles', JSON.stringify(selectedProfile));
      window.dispatchEvent(new CustomEvent('profileSelected'));

      setSelectedProfileId(profileId)
     
    }
  };

  const handleCreateNew = () => {
    navigate('/profile');
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, profileId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedProfileId(profileId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProfileId(null);
  };

  const handleInterviewClick = async (event: React.MouseEvent<HTMLElement>, profileId: string) => {
    event.stopPropagation();

    const selectedProfile = profiles.find(p => p.id === profileId);

    if (selectedProfile) {
      localStorage.setItem('profileId', profileId);
      localStorage.setItem('profiles', JSON.stringify(selectedProfile));
      window.dispatchEvent(new CustomEvent('profileSelected'));

      onSelect?.(profileId);
    
      navigate('/interview');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProfileId) return;

    setLoading(true);
    setError(null);

    try {
      await ProfileService.deleteProfile(selectedProfileId);
      setProfiles(profiles.filter(p => p.id !== selectedProfileId));
      setSuccessMessage(t('profile.delete_success'));
    } catch (error) {
      console.error('Error deleting profile:', error);
      setError(t('profile.delete_error'));
    } finally {
      setDeleteDialogOpen(false);
      setLoading(false);
      setSelectedProfileId(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ 
        mt: 4, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <CircularProgress />
      </Container>
    );
  }

  // Rest of your rendering code...
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            {t('profile.select_profile')}
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          <Box sx={{
             display: 'flex',
             justifyContent: 'space-between',
             alignItems: 'end',
             flexDirection: 'row'
          }}>
            <img  onClick={handleCreateNew} src="/public/create-profile.jpg" style={{ cursor: 'pointer', width: '140px' }} alt="Noblivion Logo"></img>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={handleCreateNew}
              fullWidth
              sx={{ mb: 3, backgroundColor: 'gold', '&:hover': {
                    backgroundColor: '#e2bf02',
                    color: 'white'
                  } }}
            >
              {t('profile.create_new')}
            </Button>
            <Paper elevation={3} sx={{ p: 2, marginLeft: '80px', backgroundColor: '#f2f0e8' }}>
              <Box 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ flex: 1 }}
                >
                  {t('profile.help3')}
                </Typography>
              </Box>
              </Paper>
          </Box>
          <Divider sx={{ my: 2 }}>{t('profile.or_continue')}</Divider>

          <List sx={{ width: '100%' }}>
            {profiles.map((profile) => (
              <ListItem
                key={profile.id}
                onClick={() => handleProfileSelect(profile.id)}
                sx={{
                  mb: 1,
                  border: '1px solid',
                  borderColor: profile.id === selectedProfileId ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  cursor: 'pointer',
                  backgroundColor: profile.id === selectedProfileId ? 'action.selected' : 'inherit',
                  '&:hover': {
                    backgroundColor: profile.id === selectedProfileId ? 'action.selected' : 'action.hover',
                  },
                }}
              >
                <Grid container spacing={2} alignItems="center">
                  {/* Profile Info (Left) */}
                  <Grid item xs={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={profile.profile_image_url}
                        alt={`${profile.first_name} ${profile.last_name}`}
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          bgcolor: 'primary.main'
                        }}
                      >
                        {!profile.profile_image_url && `${profile.first_name[0]}${profile.last_name[0]}`}
                      </Avatar>
                      <Stack spacing={0}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {profile.first_name} {profile.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('profile.age')}: {calculateAge(profile.date_of_birth)}
                        </Typography>
                      </Stack>
                    </Box>
                  </Grid>

                  {/* Session Info (Middle) */}
                  <Grid item xs={3}>
                    <Stack direction="row" spacing={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ForumIcon sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {profile.metadata?.session_count || 0} {t('profile.sessions')}
                        </Typography>
                      </Box>
                      {profile.updated_at && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDistance(new Date(profile.updated_at), new Date(), { 
                              addSuffix: true,
                              locale: getCurrentLocale()
                            })}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  </Grid>

                  {/* Actions (Right) */}
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    {!profile.subscribed_at && (
                      <Button
                        variant="contained"
                        className="gold-button"
                        sx={{ 
                          mb: 0,
                          mr: 3
                        }}
                        
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProfile(profile);
                          setBuyModalOpen(true);
                        }}
                      >
                        {t('profile.buy')}
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<RobotIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileSelect(profile.id,'/chat');
                      }}
                      sx={{ 
                        mr: 1,
                        bgcolor: '#1eb3b7',
                        '&:hover': {
                          bgcolor: '#179699'
                        }
                      }}
                    >
                      {t('profile.chat')}
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<ForumIcon />}
                      onClick={(e) => handleInterviewClick(e, profile.id)}
                      sx={{ mr: 1 }}
                    >
                      Interview
                    </Button>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, profile.id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </ListItem>
            ))}
          </List>

          {profiles.length === 0 && !error && (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
              {t('profile.no_profiles')}
            </Typography>
          )}

          {/* Actions Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem 
              onClick={() => {
                const profileToInvite = selectedProfileId;
                handleMenuClose();
                setSelectedProfileId(profileToInvite);
                setInviteDialogOpen(true);
              }}
            >
              <InviteIcon sx={{ mr: 1 }} />
              {t('profile.invite_interview')}
            </MenuItem>

            <MenuItem 
              onClick={() => {
                const profileToPrint = selectedProfileId;
                handleMenuClose();
                navigate('/print');
              }}
            >
              <PrintIcon sx={{ mr: 1 }} />
              {t('profile.print_profile')}
            </MenuItem>
             
            <MenuItem 
              onClick={() => {
                const profileToDelete = selectedProfileId;
                handleMenuClose();
                setSelectedProfileId(profileToDelete);
                setDeleteDialogOpen(true);
              }} 
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon sx={{ mr: 1 }} />
              {t('profile.remove_profile')}
            </MenuItem>
          </Menu>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => !loading && setDeleteDialogOpen(false)}
          >
            <DialogTitle>{t('profile.confirm_delete')}</DialogTitle>
            <DialogContent>
              <Typography>
                {t('profile.delete_warning')}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDeleteDialogOpen(false)}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleDeleteConfirm} 
                color="error" 
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
              >
                {t('common.delete')}
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>

      {/* Feedback Messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)}
          severity="success"
          variant="filled"
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>

      <BuyProduct
        open={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        profileId={selectedProfile?.id || ''}
        profileName={selectedProfile?.first_name || ''}
      />

      <InvitationDialog
        open={inviteDialogOpen}
        onClose={() => {
          setInviteDialogOpen(false);
          setSelectedProfileId(null);
        }}
        profile={profiles.find(p => p.id === selectedProfileId) || null}
        onSuccess={() => {
          setSuccessMessage(t('invitation.sent_success'));
        }}
      />

      <SupportBot />
      
    </Container>
  );
};

export default ProfileSelection;