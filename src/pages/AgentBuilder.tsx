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
import BuilderBot from '../components/BuilderBot';
import BuilderCanvas from '../components/agents/BuilderCanvas';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const AgentBuilder: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
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
  const { t, i18n } = useTranslation(['profile', 'invitation', 'interview', 'common']);

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
         

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          
          <BuilderCanvas />
         
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

      <BuilderBot />
      
    </Container>
  );
};

export default AgentBuilder;