// pages/AgentsCatalogPage.tsx
import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Button,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WidgetsIcon from '@mui/icons-material/Widgets';
import { useTranslation } from 'react-i18next';
import AgentsCatalog from '../components/AgentsCatalog';
import DiscoveryModal from '../components/agents/DiscoveryModal';
import AgentWrapperWizard from '../components/agents/AgentWrapperWizard';
import AgentsFooter from '../components/AgentsFooter';
import { useNavigate, useLocation } from 'react-router-dom';
import ChainEditorDemo from '../components/ChainEditorDemo';

const AgentsCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['agents']);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isWrapperWizardOpen, setIsWrapperWizardOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const gotoBuilder = () => {
    navigate('/builder');
  }
  
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

      <ChainEditorDemo />

      <AgentsFooter 
        onDiscoverClick={() => setIsDiscoveryModalOpen(true)}
        onWrapperClick={() => setIsWrapperWizardOpen(true)}
        onBuildClick={() => gotoBuilder()}
      />
      
      <DiscoveryModal
        open={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <AgentWrapperWizard
        open={isWrapperWizardOpen}
        onClose={() => setIsWrapperWizardOpen(false)}
        onSuccess={handleSuccess}
      />
    </Container>
  );
};

export default AgentsCatalogPage;