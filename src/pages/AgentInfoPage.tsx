// pages/AgentInfoPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  IconButton,
  Alert,
  Fab
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../services/agents';
import { Agent } from '../types/agent';
import { InputTab } from '../components/agents/tabs/InputTab';
import { OutputTab } from '../components/agents/tabs/OutputTab';
import { CredentialsTab } from '../components/agents/tabs/CredentialsTab';
import { CostsTab } from '../components/agents/tabs/CostsTab';
import { TestAgentDialog } from '../components/agents/TestAgentDialog';
import { AgentStatusIndicator } from '../components/agents/AgentStatusIndicator';
import ReflectionTab from '../components/agents/tabs/ReflectionTab';
import AgentIcon from '../components/agents/AgentIcon';
import CustomTabstrip from '../components/CustomTabstrip';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const schema = {
  type: "object",
  properties: {
    name: {
      type: "string",
      title: "Full Name",
      description: "Enter your full name"
    },
    age: {
      type: "number",
      title: "Age" 

    },
    addresses: {
      type: "array",
      title: "Addresses",
      items: {
        type: "object",
        properties: {
          street: {
            type: "string",
            title: "Street Address"
          },
          city: {
            type: "string",
            title: "City",
            description: "Must be in germany!"
          },
          zipCode: {
            type: "string",
            title: "ZIP Code",
            description: "5 digits"
          }
        }
      }
    }
  }
};

const AgentInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const { t, i18n } = useTranslation(['agents']);

  const handleSchemaSubmit = (data) => {
    console.log('Form data:', data);
  };

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        if (!id) {
          throw new Error('Agent ID is required');
        }
        const data = await AgentService.getAgent(id);
        setAgent(data);
        console.log(JSON.stringify(data))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch agent');
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !agent) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Agent not found'}
        </Alert>
      </Container>
    );
  }

  // The order of tabs in the TabPanel needs to match the order in CustomTabstrip
  // Security/Auth first, costs last

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex',
                  border: 'solid 1px #ccc',
                  borderRadius: '30px',
                  alignItems: 'center', gap: 2, mb: 0, position: 'relative' }}>
          <AgentIcon agent={agent} size={60} />

          <Typography variant="h5" color="primary" component="h1">
            {agent.title[i18n.language as keyof typeof agent.title] || agent.title.en}
          </Typography>

          <Fab
            size="medium"
            onClick={() => setTestDialogOpen(true)}
            sx={{
              position: 'absolute', 
              right: '6px',
              top: '4px', 
              backgroundColor: 'gold',
              '&:hover': {
                backgroundColor: '#DAA520', // Darker gold (goldenrod)
              },
              '&:disabled': {
                backgroundColor: 'rgba(218, 165, 32, 0.5)', // Semi-transparent goldenrod
              }
            }}
          >
            <DirectionsRunOutlinedIcon />
          </Fab>
        </Box>

        <TestAgentDialog
          open={testDialogOpen}
          onClose={() => setTestDialogOpen(false)}
          agent={agent}
        />

        <Paper sx={{ mt: 2 }}>
       
          {/* Replace the MUI Tabs with our custom tabstrip */}
          <CustomTabstrip 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
          />

          <TabPanel value={tabValue} index={1} >
            <CredentialsTab 
              agent={agent} 
              onAgentUpdated={(updatedAgent) => {
                // Update your agent state here
                setAgent(updatedAgent);
              }} 
            />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <InputTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <OutputTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <ReflectionTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={0}>
            <CostsTab agent={agent} />
          </TabPanel>

          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'end', paddingRight: '24px', paddingBottom: '10px', gap: 2, right: 0 }}>
            <Typography variant="body1" color="text.secondary">
              <small>{t('agents.is_online')}</small>
            </Typography>
            <AgentStatusIndicator agentEndpoint={agent.agent_endpoint} />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AgentInfoPage;