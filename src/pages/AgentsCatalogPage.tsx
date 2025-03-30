// pages/AgentsCatalogPage.tsx
import React, { useState } from 'react';
import { 
  Container, 
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import AgentsCatalog from '../components/AgentsCatalog';
import DiscoveryModal from '../components/agents/DiscoveryModal';
import AgentWrapperWizard from '../components/agents/AgentWrapperWizard';
import AgentsFooter from '../components/AgentsFooter';
import { useNavigate } from 'react-router-dom';
import useAgentStore from '../../stores/agentStore';
import MCPToolsImportModal from '../components/agents/MCPToolsImportModal';
import MCPToolsDrawer from '../components/agents/MCPToolsDrawer';

const AgentsCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['agents']);
  const refreshAgentsAndTeam = useAgentStore(state => state.refreshAgentsAndTeam);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isWrapperWizardOpen, setIsWrapperWizardOpen] = useState(false);
  const [isMCPToolsModalOpen, setIsMCPToolsModalOpen] = useState(false);
  const [isMCPToolsDrawerOpen, setIsMCPToolsDrawerOpen] = useState(false);
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  
  const handleSuccess = () => {
    refreshAgentsAndTeam();
  };

  const handleMCPToolsReceived = (tools: any[]) => {
    setMcpTools(tools);
    setIsMCPToolsDrawerOpen(true);
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
        <AgentsCatalog />
      </Box>

      <AgentsFooter 
        onDiscoverClick={() => setIsDiscoveryModalOpen(true)}
        onWrapperClick={() => setIsWrapperWizardOpen(true)}
        onBuildClick={() => gotoBuilder()}
        onMCPToolsClick={() => setIsMCPToolsModalOpen(true)}
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

      <MCPToolsImportModal
        open={isMCPToolsModalOpen}
        onClose={() => setIsMCPToolsModalOpen(false)}
        onToolsReceived={handleMCPToolsReceived}
      />

      <MCPToolsDrawer
        open={isMCPToolsDrawerOpen}
        onClose={() => setIsMCPToolsDrawerOpen(false)}
        tools={mcpTools}
        onImportSuccess={handleSuccess}
      />
      
    </Container>
  );
};

export default AgentsCatalogPage;