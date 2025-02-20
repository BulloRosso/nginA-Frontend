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
import { useTranslation } from 'react-i18next';
import { AgentService } from '../services/agents';
import { Agent } from '../types/agent';
import { InputTab } from '../components/agents/tabs/InputTab';
import { OutputTab } from '../components/agents/tabs/OutputTab';
import { CredentialsTab } from '../components/agents/tabs/CredentialsTab';
import { CostsTab } from '../components/agents/tabs/CostsTab';

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

const AgentInfoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { t, i18n } = useTranslation('agents');

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
      <Box sx={{ mb: 4 }}>
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ mb: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h4" component="h1" gutterBottom>
          {agent.title[i18n.language as keyof typeof agent.title] || agent.title.en}
        </Typography>

        <Typography variant="body1" paragraph>
          {agent.description[i18n.language as keyof typeof agent.description] || agent.description.en}
        </Typography>

        <Paper sx={{ mt: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            aria-label="agent information tabs"
          >
            <Tab label={t('tabs.input')} />
            <Tab label={t('tabs.output')} />
            <Tab label={t('tabs.credentials')} />
            <Tab label={t('tabs.costs')} />
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
        </Paper>
      </Box>
    </Container>
  );
};

export default AgentInfoPage;