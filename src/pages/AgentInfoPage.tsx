// pages/AgentInfoPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  IconButton,
  Alert
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import { Fab } from '@mui/material';
import InputIcon from '@mui/icons-material/Input';
import OutputIcon from '@mui/icons-material/Output';
import SecurityIcon from '@mui/icons-material/Security';
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined';
import { useTranslation } from 'react-i18next';
import { AgentService } from '../services/agents';
import { Agent } from '../types/agent';
import { InputTab } from '../components/agents/tabs/InputTab';
import { OutputTab } from '../components/agents/tabs/OutputTab';
import { CredentialsTab } from '../components/agents/tabs/CredentialsTab';
import { CostsTab } from '../components/agents/tabs/CostsTab';
import { TestAgentDialog } from '../components/agents/TestAgentDialog';
import { AgentStatusIndicator } from '../components/agents/AgentStatusIndicator';
import RemoveRedEyeOutlinedIcon from '@mui/icons-material/RemoveRedEyeOutlined';
import InputFormForSchema from '../components/agents/tabs/InputFormForSchema';

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 3 }}>
      

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative' }}>
          <img 
            src="/img/robot-head-outline.svg" 
            alt="Robot head icon" 
            style={{ width: '32px', height: '32px' }}
          />
          <Typography variant="h4" component="h1">
            {agent.title[i18n.language as keyof typeof agent.title] || agent.title.en}
          </Typography>

        
          
          <Fab
            
            size="medium"
            onClick={() => setTestDialogOpen(true)}
            sx={{ backgroundColor: 'gold', position: 'absolute', right: 0 }}
          >
            <DirectionsRunOutlinedIcon />
          </Fab>
        </Box>

        <TestAgentDialog
          open={testDialogOpen}
          onClose={() => setTestDialogOpen(false)}
          agent={agent}
        />

        <Typography variant="body1" paragraph>
          {agent.description[i18n.language as keyof typeof agent.description] || agent.description.en}
        </Typography>

        <Paper sx={{ mt: 4 }}>

         
          
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            aria-label="agent information tabs"
          >
            <Tab 
              icon={<InputIcon />} 
              iconPosition="start" 
              label={t('agents.tabs.input')} 
            />
            <Tab 
              icon={<OutputIcon />} 
              iconPosition="start" 
              label={t('agents.tabs.output')} 
            />
            <Tab 
              icon={<SecurityIcon />} 
              iconPosition="start" 
              label={t('agents.tabs.credentials')} 
            />
            <Tab 
              icon={<MonetizationOnOutlinedIcon />} 
              iconPosition="start" 
              label={t('agents.tabs.costs')} 
            />
            <Tab 
              icon={<RemoveRedEyeOutlinedIcon />} 
              iconPosition="start" 
              label={t('agents.tabs.evals')} 
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <InputTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <OutputTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <CredentialsTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <CostsTab agent={agent} />
          </TabPanel>
          <TabPanel value={tabValue} index={4}>
            <InputFormForSchema schema={schema} onSubmit={handleSchemaSubmit} />
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