// pages/AgentsCatalogPage.tsx
import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import AgentsCatalog from '../components/AgentsCatalog';
import DiscoveryModal from '../components/agents/DiscoveryModal';

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