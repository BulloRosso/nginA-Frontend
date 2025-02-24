// pages/AgentsCatalogPage.tsx
import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button,
  Modal,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import AgentsCatalog from '../components/AgentsCatalog';
import { AgentService } from '../services/agents';


const DiscoveryModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation(['agents']);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDiscover = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await AgentService.discoverAgent(url);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to discover agent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={!isLoading ? onClose : undefined}
      aria-labelledby="discover-agent-modal"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        borderRadius: 1,
      }}>
        <Typography variant="h6" component="h2" gutterBottom>
          {t('agents.discover_new')}
        </Typography>

        <Typography variant="body2" sx={{ mb: 2 }}>
          The endpoint is to be expected to return a discovery information when called with GET
        </Typography>

        <TextField
          fullWidth
          label={t('agents.discovery_url')}
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={onClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleDiscover}
            disabled={!url || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {t('agents.discover_now')}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

const AgentsCatalogPage: React.FC = () => {
  const { t } = useTranslation(['agents']);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDiscoverySuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Container 
      maxWidth={false} 
      disableGutters 
      sx={{ 
        width: '100%',
        margin: 0,
        padding: 0,
      }}
    >

      <Box sx={{ paddingRight: '20px'}}>
        <AgentsCatalog key={refreshKey} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDiscoveryModalOpen(true)}
        >
          {t('agents.discover_new')}
        </Button>
      </Box>

      <DiscoveryModal
        open={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        onSuccess={handleDiscoverySuccess}
      />
    </Container>
  );
};

export default AgentsCatalogPage;