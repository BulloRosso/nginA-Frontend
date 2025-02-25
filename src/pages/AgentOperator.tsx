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

import { de, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import BuyProduct from '../components/modals/BuyProduct';
import './styles/GoldButton.css';
import InvitationDialog from '../components/modals/InvitationDialog';
import SupportBot from '../components/SupportBot';
import TeamStatus from '../components/agents/TeamStatus';

interface ProfileSelectionProps {
  onSelect?: (profileId: string) => void;
}

const AgentOperator: React.FC<ProfileSelectionProps> = ({ onSelect }) => {
  
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

  const { t, i18n } = useTranslation(['agents','profile', 'invitation', 'interview', 'common']);

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
      const initializePage = async () => {
         
        setLoading(false)
      };

      initializePage();
  }, []);


  

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 2, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, paddingBottom: 0  }}>
          <Typography variant="h5" sx={{ mb: '24px' }}>
            {t('agents.select_agent')}
          </Typography>

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

           <TeamStatus />
          
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

export default AgentOperator;