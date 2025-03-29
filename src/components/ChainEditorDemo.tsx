import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Container, 
  Divider, 
  TextField,
  Tabs,
  Tab,
  Grid,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChainEditor from './ChainEditor';
import { AgentService } from '../services/agents';
import useAgentStore from '../../stores/agentStore';
import AddReactionOutlinedIcon from '@mui/icons-material/AddReactionOutlined';

interface ChainConfig {
  agents: {
    id: string;
    connectorType: 'magic' | 'code';
    connectorJsCode: string;
    connectorPrompt: string;
    connectorValid: boolean;
  }[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chain-editor-tabpanel-${index}`}
      aria-labelledby={`chain-editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `chain-editor-tab-${index}`,
    'aria-controls': `chain-editor-tabpanel-${index}`,
  };
}

const STORAGE_KEY = 'chainEditor';

const ChainEditorDemo: React.FC = () => {
  const navigate = useNavigate();
  const [chainConfig, setChainConfig] = useState<ChainConfig | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [iconSvg, setIconSvg] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Access agent store to update the catalog
  const { refreshAgentsAndTeam } = useAgentStore();

  // Load saved chain configuration from localStorage on initial render
  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setChainConfig(parsedConfig);
      } catch (error) {
        console.error('Error parsing saved chain configuration:', error);
      }
    }
  }, []);

  // Use useCallback to prevent the function from changing on every render
  const handleChainChange = useCallback((config: ChainConfig) => {
    setChainConfig(config);
    // Save to localStorage whenever the chain configuration changes
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, []);

  // Initial chain configuration that doesn't change between renders
  // We'll use React.useMemo to ensure this object isn't recreated on each render
  const initialChain = React.useMemo(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.error('Error parsing saved chain configuration:', error);
      }
    }

    // Default initial chain if nothing is in localStorage
    return {
      agents: [
        {
          id: '9df9a066-0abd-4fbf-bc05-c74ba8ed5cbb', // This would be your initial agent ID
          connectorType: 'magic',
          connectorJsCode: '',
          connectorPrompt: '', // Initialize with empty prompt
          connectorValid: false
        }
      ]
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Check if the Create Agent button should be enabled
  const isCreateButtonEnabled = React.useMemo(() => {
    return (
      title.trim() !== '' && 
      description.trim() !== '' && 
      chainConfig && 
      chainConfig.agents.length > 1
    );
  }, [title, description, chainConfig]);

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if the file is an SVG
      if (file.type !== 'image/svg+xml') {
        showSnackbar('Please upload an SVG file', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const svgContent = e.target?.result as string;
        setIconSvg(svgContent);
        showSnackbar('Icon uploaded successfully', 'success');
      };
      reader.readAsText(file);
    }
  };

  const fetchAgentInfo = async (agentId: string) => {
    try {
      return await AgentService.getAgent(agentId);
    } catch (error) {
      console.error(`Error fetching agent ${agentId}:`, error);
      return null;
    }
  };

  const handleCreateAgent = async () => {
    if (!chainConfig || !isCreateButtonEnabled) return;

    setIsLoading(true);
    try {
      // Get the first agent in the chain to extract input schema
      const firstAgentId = chainConfig.agents[0].id;
      const firstAgent = await fetchAgentInfo(firstAgentId);

      // Get the last agent in the chain to extract output schema
      const lastAgentId = chainConfig.agents[chainConfig.agents.length - 1].id;
      const lastAgent = await fetchAgentInfo(lastAgentId);

      if (!firstAgent || !lastAgent) {
        showSnackbar('Failed to fetch agent information.', 'error');
        setIsLoading(false);
        return;
      }

      // Create the agent data object
      const newAgentData = {
        title: { en: title, de: '' }, // Using English title only
        description: { en: description, de: '' }, // Using English description only
        input: firstAgent.input,
        input_example: firstAgent.input_example,
        output: lastAgent.output,
        output_example: lastAgent.output_example,
        agent_endpoint: 'internal',
        type: 'chain', // Ensure the type is explicitly set to 'chain'
        configuration: chainConfig,
        credits_per_run: 5, // Default value, adjust as needed
        stars: 0,
        icon_svg: iconSvg // Add the uploaded SVG icon
      };

      // Create the agent using the service - no mock data
      const createdAgent = await AgentService.createAgent(newAgentData);

      showSnackbar('Agent created successfully!', 'success');
      console.log('Agent created:', createdAgent);

      // Save the current chain configuration to localStorage before navigating
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chainConfig));

      // Refresh the agents in the store so the new agent appears in the catalog
      await refreshAgentsAndTeam();

      // Navigate to the agents list page
      setTimeout(() => {
        navigate('/agents');
      }, 1500); // Small delay to allow the user to see the success message
    } catch (error) {
      console.error('Error creating agent:', error);
      showSnackbar('Failed to create agent. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 0 }}>
        <ChainEditor 
          onChange={handleChainChange} 
          initialChain={initialChain}
        />

        <Paper elevation={3} sx={{ p: 2, borderRadius: '10px', mt:3, mb: 3 }}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabIndex} onChange={handleTabChange} aria-label="chain configuration tabs">
                <Tab label="Agent Description" {...a11yProps(0)} />
                <Tab label="Configuration" {...a11yProps(1)} />
              </Tabs>
            </Box>

            <TabPanel value={tabIndex} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    variant="outlined"
                    placeholder="Enter agent title in English"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <input
                            accept=".svg"
                            id="icon-upload"
                            type="file"
                            style={{ display: 'none' }}
                            onChange={handleIconUpload}
                          />
                          <label htmlFor="icon-upload">
                            <IconButton 
                              color="primary" 
                              aria-label="upload icon" 
                              component="span"
                              title="Upload SVG Icon"
                            >
                              <AddReactionOutlinedIcon />
                            </IconButton>
                          </label>
                        </InputAdornment>
                      ),
                    }}
                  />
                  {iconSvg && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          mr: 1,
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        dangerouslySetInnerHTML={{ __html: iconSvg }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        SVG icon uploaded
                      </Typography>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    variant="outlined"
                    placeholder="Enter agent description in English"
                    multiline
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={tabIndex} index={1}>
              <Box sx={{ backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  JSON Output:
                </Typography>
                <pre style={{ overflowX: 'auto', backgroundColor: '#eee', padding: '16px', borderRadius: '4px' }}>
                  {JSON.stringify(chainConfig, null, 2)}
                </pre>
              </Box>
            </TabPanel>
          </Box>
        </Paper>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained"
            sx={{ 
              backgroundColor: 'gold',
              '&:hover': {
                backgroundColor: '#e6c700',
              },
              '&.Mui-disabled': {
                backgroundColor: '#f5f5dc',
              }
            }}
            disabled={!isCreateButtonEnabled || isLoading}
            onClick={handleCreateAgent}
          >
            {isLoading ? 'Creating...' : 'Create Agent'}
          </Button>
        </Box>
      </Box>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChainEditorDemo;